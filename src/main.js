/* Punto de entrada de la SPA: inicializa Auth, resuelve hash y monta la página. */
import { iniciarAuth, obtenerEstadoAuth, suscribirAuth, cerrarSesion } from './auth/AuthProvider.js';
import { rutaActual, resolverRuta, navegar } from './router.js';
import { puedeEntrar, rutaSinPermiso } from './auth/RutaProtegida.js';
import { layout } from './components/layout.js';
import { skeleton, refrescarIconos, toast, ocultarModal } from './components/components.js';
import { etiquetaRol } from './lib/permisos.js';
import { configurado } from './lib/supabase.js';
import { escaparHTML } from './lib/format.js';

window.app = { auth: obtenerEstadoAuth(), navegar, etiquetaRol };
function escucharGlobal() {
  document.addEventListener('click', async (evento) => {
    const navegarEl = evento.target.closest('[data-navegar]'); if (navegarEl) { evento.preventDefault(); navegar(navegarEl.dataset.navegar); }
    const cerrar = evento.target.closest('[data-cerrar-modal]'); if (cerrar) ocultarModal(cerrar.dataset.cerrarModal);
    const cerrarToast = evento.target.closest('[data-cerrar-toast]'); if (cerrarToast) document.getElementById(cerrarToast.dataset.cerrarToast)?.remove();
    const logout = evento.target.closest('[data-logout]'); if (logout) { await cerrarSesion(); navegar('/login'); }
  });
  window.addEventListener('hashchange', render);
}
async function render() {
  const ruta = rutaActual(); const definición = resolverRuta(ruta); const auth = obtenerEstadoAuth(); window.app.auth = auth;
  if (auth.cargando) { document.getElementById('app').innerHTML = `<div class="grid min-h-screen place-items-center bg-cream p-6">${skeleton(2)}</div>`; return; }
  if (!auth.sesión && ruta !== '/login') { navegar('/login'); return; }
  if (auth.sesión && ruta === '/login') { navegar('/'); return; }
  if (ruta === '/login') { const módulo = await definición.módulo(); document.getElementById('app').innerHTML = módulo.renderLogin(); módulo.enlazarLogin?.(); refrescarIconos(); return; }
  if (!auth.perfil || !puedeEntrar(auth.perfil, definición.permiso)) { document.getElementById('app').innerHTML = layout({ ruta, perfil: auth.perfil || {}, contenido: rutaSinPermiso() }); refrescarIconos(); return; }
  document.getElementById('app').innerHTML = layout({ ruta, perfil: auth.perfil, contenido: `<div class="fade-in">${skeleton(3)}</div>` }); refrescarIconos();
  try { const módulo = await definición.módulo(); const contenido = await módulo.render?.({ perfil: auth.perfil, ruta }); const página = document.getElementById('page-content'); if (página) página.innerHTML = contenido; módulo.enlazar?.({ perfil: auth.perfil, ruta }); refrescarIconos(); }
  catch (error) { const página = document.getElementById('page-content'); if (página) página.innerHTML = `<div class="rounded-3xl border border-error/30 bg-white p-8"><div class="flex gap-3 text-error"><span>${escaparHTML(error.message || 'Error inesperado')}</span></div><button data-navegar="/" class="mt-5 rounded-2xl bg-clay px-4 py-2.5 text-sm font-semibold text-white">Volver</button></div>`; refrescarIconos(); }
}
suscribirAuth(() => { window.app.auth = obtenerEstadoAuth(); render(); });
escucharGlobal();
iniciarAuth().then(render).catch((error) => { console.error(error); if (configurado) toast(error.message, 'error'); render(); });
