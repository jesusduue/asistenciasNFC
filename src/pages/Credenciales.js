/* Credenciales NFC: alta, activación y revocación; nunca expone tok_nfc. */
import { listar, insertar, actualizar } from '../lib/api.js';
import { fechaHoy, formatearFecha, escaparHTML } from '../lib/format.js';
import { tabla, tarjeta, badge, boton, campo, selección, lectorNFC, enlazarNFC, modal, mostrarModal, ocultarModal, vacío, icono, refrescarIconos, toast } from '../components/components.js';
import { encabezado, leerFormulario, confirmar } from './utils.js';

let contexto = { filas: [], personas: [] };
function estadoCredencial(fila) { if (fila.est_cred === 'r') return badge('Revocada', 'danger'); if (fila.fec_venc && fila.fec_venc < fechaHoy()) return badge('Vencida', 'danger'); const límite = new Date(); límite.setDate(límite.getDate() + 30); if (fila.fec_venc && fila.fec_venc <= límite.toISOString().slice(0, 10)) return badge('Por vencer', 'warning'); return fila.est_cred === 'a' ? badge('Activa', 'success') : badge('Inactiva', 'neutral'); }
function pintarTabla(filas) {
  if (!filas.length) return vacío('No hay credenciales', 'Emite una credencial para vincularla a una persona.', 'contactless');
  return tabla({ filas, clave: 'id_cred', columnas: [
    { label: 'Persona', render: (f) => `<div><p class="font-semibold">${escaparHTML(f.personal?.nom_per || '—')}</p><p class="text-xs text-ink/50">${escaparHTML(f.personal?.ced_per || '')}</p></div>` },
    { label: 'UID', render: (f) => `<code class="rounded-lg bg-sand px-2 py-1 text-xs tracking-wider">${escaparHTML(f.uid_nfc)}</code>` },
    { label: 'Emisión', render: (f) => formatearFecha(f.fec_emision) },
    { label: 'Vencimiento', render: (f) => formatearFecha(f.fec_venc) },
    { label: 'Estado', render: (f) => estadoCredencial(f) },
    { label: 'Acciones', render: (f) => `<div class="flex justify-end gap-1">${f.est_cred === 'r' || f.est_cred === 'i' ? `<button data-reactivar-credencial="${f.id_cred}" class="rounded-xl p-2 text-success hover:bg-[#E5F0E2]">${icono('rotate-ccw')}</button>` : `<button data-revocar-credencial="${f.id_cred}" class="rounded-xl p-2 text-error hover:bg-[#F8E0DB]">${icono('shield-off')}</button>`}</div>` }
  ] });
}
function pintarModal(personas) {
  return modal({ título: 'Emitir credencial NFC', id: 'modal-credencial', cuerpo: `<form id="form-credencial" class="space-y-4">${lectorNFC({ inputId: 'cred-uid' })}${selección({ id: 'cred-persona', label: 'Personal', opciones: personas.map((p) => ({ value: p.id_per, label: `${p.nom_per} · ${p.ced_per}` })), required: true })}<div class="grid gap-4 sm:grid-cols-2">${campo({ id: 'cred-emision', label: 'Fecha de emisión', tipo: 'date', valor: fechaHoy(), required: true })}${campo({ id: 'cred-vencimiento', label: 'Fecha de vencimiento', tipo: 'date', hint: 'Opcional' })}</div><label class="block"><span class="mb-1.5 block text-sm font-semibold">Observación</span><textarea id="cred-observacion" rows="3" class="w-full rounded-2xl border border-border bg-white px-3.5 py-3 text-sm focus:border-clay focus:ring-4 focus:ring-accent/25"></textarea></label><div class="flex justify-end gap-2">${boton('Cancelar', { tipo: 'secondary', attrs: 'data-cerrar-modal="modal-credencial"' })}${boton('Guardar credencial', { attrs: 'type="submit"', icon: 'save' })}</div></form>` });
}
export async function render() {
  const [filas, personas] = await Promise.all([
    listar('credencial_nfc', { select: 'id_cred,uid_nfc,fky_per,fec_emision,fec_venc,est_cred,observ,personal:fky_per(id_per,ced_per,nom_per)', order: { campo: 'fec_emision', asc: false } }),
    listar('personal', { select: 'id_per,ced_per,nom_per', filtros: [['eq', 'est_per', 'a']], order: { campo: 'nom_per', asc: true } })
  ]);
  contexto = { filas, personas };
  const fechaLímite = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const alertas = filas.filter((f) => f.est_cred === 'a' && f.fec_venc && f.fec_venc <= fechaLímite).length;
  const alertaHTML = alertas ? `<div class="mb-5 rounded-2xl border border-warning/30 bg-[#F8EDD3] p-4 text-sm text-[#855B14]"><strong>${alertas} credencial${alertas > 1 ? 'es' : ''}</strong> requiere${alertas > 1 ? 'n' : ''} revisión por vencimiento próximo o cumplido.</div>` : '';
  const contenido = tarjeta(`<div class="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h3 class="font-semibold">Credenciales emitidas</h3><p class="mt-1 text-xs text-ink/55">El UID es visible para operación; tok_nfc nunca se muestra.</p></div>${badge(`${filas.filter((f) => f.est_cred === 'a').length} activas`, 'success')}</div>${pintarTabla(filas)}`);
  return encabezado('Credenciales NFC', 'Emite, revisa y revoca identificadores de acceso.', boton('Emitir credencial', { icon: 'contactless', attrs: 'data-nueva-credencial' })) + alertaHTML + contenido + pintarModal(personas);
}
export function enlazar() {
  refrescarIconos(); enlazarNFC();
  document.querySelector('[data-nueva-credencial]')?.addEventListener('click', () => mostrarModal('modal-credencial'));
  document.querySelectorAll('[data-revocar-credencial]').forEach((botón) => botón.addEventListener('click', async () => { if (!confirmar('¿Revocar esta credencial? No podrá marcar asistencia hasta reactivarla.')) return; try { await actualizar('credencial_nfc', 'id_cred', botón.dataset.revocarCredencial, { est_cred: 'r' }); toast('Credencial revocada.'); window.location.reload(); } catch (error) { toast(error.message, 'error'); } }));
  document.querySelectorAll('[data-reactivar-credencial]').forEach((botón) => botón.addEventListener('click', async () => { try { await actualizar('credencial_nfc', 'id_cred', botón.dataset.reactivarCredencial, { est_cred: 'a' }); toast('Credencial reactivada.'); window.location.reload(); } catch (error) { toast(error.message, 'error'); } }));
  document.getElementById('form-credencial')?.addEventListener('submit', async (evento) => { evento.preventDefault(); const formulario = leerFormulario(evento.currentTarget); const uid = String(formulario['cred-uid'] || '').replace(/:/g, '').replace(/\s+/g, '').toUpperCase(); if (!uid) { toast('Captura o escribe el UID de la credencial.', 'warning'); return; } try { await insertar('credencial_nfc', { uid_nfc: uid, fky_per: formulario['cred-persona'], fec_emision: formulario['cred-emision'], fec_venc: formulario['cred-vencimiento'] || null, observ: formulario['cred-observacion'] || null, est_cred: 'a' }); toast('Credencial emitida.'); ocultarModal('modal-credencial'); window.location.reload(); } catch (error) { toast(error.message, 'error'); } });
}
