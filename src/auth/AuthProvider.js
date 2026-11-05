/* Proveedor de Auth: sesión, perfil de negocio por auth_uid y cierre seguro. */
import { supabase, configurado } from '../lib/supabase.js';
import { obtenerPerfil } from '../lib/api.js';

let estado = { sesión: null, perfil: null, cargando: true };
const escuchas = new Set();
function notificar() { escuchas.forEach((fn) => fn({ ...estado })); }
export function obtenerEstadoAuth() { return { ...estado }; }
export function suscribirAuth(fn) { escuchas.add(fn); return () => escuchas.delete(fn); }
export async function iniciarAuth() {
  if (!configurado) { estado = { sesión: null, perfil: null, cargando: false }; notificar(); return estado; }
  try {
    const { data } = await supabase.auth.getSession();
    if (data.session) await cargarPerfil(data.session); else estado = { sesión: null, perfil: null, cargando: false };
    supabase.auth.onAuthStateChange(async (_evento, sesión) => { if (sesión) await cargarPerfil(sesión); else { estado = { sesión: null, perfil: null, cargando: false }; notificar(); } });
  } catch (error) {
    estado = { sesión: null, perfil: null, cargando: false, error: error.message || 'No se pudo consultar la sesión.' };
  }
  notificar();
  return estado;
}
async function cargarPerfil(sesión) {
  estado = { sesión, perfil: null, cargando: true }; notificar();
  try {
    const perfil = await obtenerPerfil(sesión.user.id);
    const válido = perfil && perfil.est_usu === 'a' && perfil.rol?.nom_rol && perfil.rol?.est_rol === 'a' && (!perfil.personal || perfil.personal.est_per !== 'i');
    if (!válido) { await supabase.auth.signOut(); estado = { sesión: null, perfil: null, cargando: false, error: 'Usuario sin acceso al sistema' }; }
    else { estado = { sesión, perfil, cargando: false }; }
  } catch (error) { await supabase.auth.signOut(); estado = { sesión: null, perfil: null, cargando: false, error: error.message }; }
  notificar();
}
export async function iniciarSesion(email, contraseña) { if (!configurado) throw new Error('Supabase no está configurado.'); const { error } = await supabase.auth.signInWithPassword({ email, password: contraseña }); if (error) throw error; }
export async function cerrarSesion() { if (supabase) await supabase.auth.signOut(); estado = { sesión: null, perfil: null, cargando: false }; notificar(); }
