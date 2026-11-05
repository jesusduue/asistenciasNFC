/* Consulta y corrección de asistencias con validación de horas y alta manual. */
import { listar, actualizarAsistencia, guardarAsistencia } from '../lib/api.js';
import { fechaHoy, fechaHaceDías, formatearFecha, formatearHora, formatearHoras, escaparHTML, horaParaInput } from '../lib/format.js';
import { tabla, tarjeta, badge, estadoAsistencia, boton, campo, selección, modal, mostrarModal, ocultarModal, vacío, icono, refrescarIconos, toast } from '../components/components.js';
import { encabezado, leerFormulario, confirmar } from './utils.js';

let contexto = { filas: [], personas: [], turnos: [] };
let perfilActual = null;
export async function render({ perfil } = {}) {
  perfilActual = perfil;
  const [filas, personas, turnos] = await Promise.all([
    listar('asistencia', { select: 'id_asi,fky_per,fky_turno,fec_asi,hor_lleg,hor_sal,hor_tra,metodo,est_asi,personal:fky_per(id_per,ced_per,nom_per),turno:fky_turno(id_turno,nom_turno)', order: { campo: 'fec_asi', asc: false }, limit: 500 }),
    listar('personal', { select: 'id_per,ced_per,nom_per', order: { campo: 'nom_per', asc: true } }),
    listar('turno', { select: 'id_turno,nom_turno', order: { campo: 'nom_turno', asc: true } })
  ]);
  contexto = { filas, personas, turnos };
  const puedeCorregir = perfilActual?.rol?.nom_rol !== 'vigilante';
  const acción = puedeCorregir ? boton('Registrar olvidado', { icon: 'plus', attrs: 'data-nuevo-asistencia' }) : '';
  return `${encabezado('Asistencias', puedeCorregir ? 'Filtra y corrige registros sin alterar las horas generadas.' : 'Consulta los marcajes registrados para la jornada.', acción)}${tarjeta(`<form id="filtros-asistencias" class="grid gap-3 md:grid-cols-2 xl:grid-cols-6">${campo({ id: 'desde', label: 'Desde', tipo: 'date', valor: fechaHaceDías(6) })}${campo({ id: 'hasta', label: 'Hasta', tipo: 'date', valor: fechaHoy() })}${campo({ id: 'buscar', label: 'Buscar', placeholder: 'Nombre o cédula' })}${selección({ id: 'filtro-turno', label: 'Turno', opciones: turnos.map((t) => ({ value: t.id_turno, label: t.nom_turno })) })}${selección({ id: 'filtro-estado', label: 'Estado', opciones: [{ value: 'a', label: 'Activa' }, { value: 'i', label: 'Anulada' }] })}<div class="flex items-end">${boton('Aplicar filtros', { attrs: 'type="submit"', icon: 'sliders-horizontal', clase: 'w-full' })}</div></form>`)}<div id="tabla-asistencias" class="mt-6">${pintarTabla(filas, puedeCorregir)}</div>${modal({ título: 'Editar asistencia', id: 'modal-editar-asistencia', cuerpo: `<form id="form-editar-asistencia" class="space-y-4"><input type="hidden" id="editar-id" />${campo({ id: 'editar-fecha', label: 'Fecha', tipo: 'date', required: true })}<div class="grid gap-4 sm:grid-cols-2">${campo({ id: 'editar-llegada', label: 'Llegada', tipo: 'time', required: true })}${campo({ id: 'editar-salida', label: 'Salida', tipo: 'time', hint: 'Déjalo vacío si la jornada sigue abierta.' })}</div><div class="flex justify-end gap-2">${boton('Cancelar', { tipo: 'secondary', attrs: 'data-cerrar-modal="modal-editar-asistencia"' })}${boton('Guardar cambios', { attrs: 'type="submit"', icon: 'save' })}</div></form>`})}${modal({ título: 'Registrar marcaje olvidado', id: 'modal-nuevo-asistencia', cuerpo: `<form id="form-nuevo-asistencia" class="space-y-4"><div class="grid gap-4 sm:grid-cols-2">${selección({ id: 'nuevo-persona', label: 'Persona', opciones: personas.map((p) => ({ value: p.id_per, label: `${p.nom_per} · ${p.ced_per}` })), required: true })}${selección({ id: 'nuevo-turno', label: 'Turno', opciones: turnos.map((t) => ({ value: t.id_turno, label: t.nom_turno })), required: true })}</div><div class="grid gap-4 sm:grid-cols-3">${campo({ id: 'nuevo-fecha', label: 'Fecha', tipo: 'date', valor: fechaHoy(), required: true })}${campo({ id: 'nuevo-llegada', label: 'Llegada', tipo: 'time', required: true })}${campo({ id: 'nuevo-salida', label: 'Salida', tipo: 'time' })}</div><div class="flex justify-end gap-2">${boton('Cancelar', { tipo: 'secondary', attrs: 'data-cerrar-modal="modal-nuevo-asistencia"' })}${boton('Guardar marcaje', { attrs: 'type="submit"', icon: 'save' })}</div></form>`})}`;
}
function pintarTabla(filas, puedeCorregir = true) {
  return tarjeta(`${filas.length ? tabla({ filas, clave: 'id_asi', columnas: [
    { label: 'Persona', render: (f) => `<div><p class="font-semibold">${escaparHTML(f.personal?.nom_per || '—')}</p><p class="text-xs text-ink/50">${escaparHTML(f.personal?.ced_per || '')}</p></div>` },
    { label: 'Fecha', render: (f) => formatearFecha(f.fec_asi) },
    { label: 'Turno', render: (f) => escaparHTML(f.turno?.nom_turno || '—') },
    { label: 'Entrada / salida', render: (f) => `<span class="text-xs">${formatearHora(f.hor_lleg)} · ${formatearHora(f.hor_sal)}</span>` },
    { label: 'Horas', render: (f) => formatearHoras(f.hor_tra) },
    { label: 'Método', render: (f) => badge(f.metodo || '—', f.metodo === 'nfc' ? 'info' : 'neutral') },
    { label: 'Estado', render: (f) => estadoAsistencia(f) },
    ...(puedeCorregir ? [{ label: 'Acciones', render: (f) => `<div class="flex justify-end gap-1"><button data-editar-asistencia="${f.id_asi}" class="rounded-xl p-2 text-clay hover:bg-sand" title="Editar">${icono('pencil')}</button>${f.est_asi === 'a' ? `<button data-anular-asistencia="${f.id_asi}" class="rounded-xl p-2 text-error hover:bg-[#F8E0DB]" title="Anular">${icono('ban')}</button>` : ''}</div>` }] : [])
  ] }) : vacío('No hay asistencias', 'Prueba otro rango o registra un marcaje olvidado.', 'clipboard-x')}`);
}
export function enlazar() {
  refrescarIconos();
  const filtros = document.getElementById('filtros-asistencias');
  filtros?.addEventListener('submit', (e) => { e.preventDefault(); const fd = new FormData(filtros); const desde = fd.get('desde'); const hasta = fd.get('hasta'); const buscar = String(fd.get('buscar') || '').toLowerCase(); const turno = String(fd.get('filtro-turno') || ''); const estado = String(fd.get('filtro-estado') || ''); const filas = contexto.filas.filter((f) => (!desde || f.fec_asi >= desde) && (!hasta || f.fec_asi <= hasta) && (!turno || String(f.fky_turno) === turno) && (!estado || f.est_asi === estado) && (!buscar || `${f.personal?.nom_per} ${f.personal?.ced_per}`.toLowerCase().includes(buscar))); document.getElementById('tabla-asistencias').innerHTML = pintarTabla(filas, perfilActual?.rol?.nom_rol !== 'vigilante'); refrescarIconos(); enlazarAcciones(); });
  if (perfilActual?.rol?.nom_rol !== 'vigilante') enlazarAcciones();
  document.querySelector('[data-nuevo-asistencia]')?.addEventListener('click', () => mostrarModal('modal-nuevo-asistencia'));
  document.getElementById('form-nuevo-asistencia')?.addEventListener('submit', async (e) => { e.preventDefault(); const f = leerFormulario(e.currentTarget); const botón = e.currentTarget.querySelector('button[type="submit"]'); botón.disabled = true; try { await guardarAsistencia({ idPer: f['nuevo-persona'], idTurno: f['nuevo-turno'], fecha: f['nuevo-fecha'], llegada: f['nuevo-llegada'], salida: f['nuevo-salida'], metodo: 'manual' }); toast('Marcaje manual registrado.'); ocultarModal('modal-nuevo-asistencia'); window.location.reload(); } catch (error) { toast(error.message, 'error'); } finally { botón.disabled = false; } });
}
function enlazarAcciones() {
  document.querySelectorAll('[data-editar-asistencia]').forEach((b) => b.addEventListener('click', () => { const fila = contexto.filas.find((f) => String(f.id_asi) === b.dataset.editarAsistencia); if (!fila) return; document.getElementById('editar-id').value = fila.id_asi; document.getElementById('editar-fecha').value = fila.fec_asi; document.getElementById('editar-llegada').value = horaParaInput(fila.hor_lleg); document.getElementById('editar-salida').value = horaParaInput(fila.hor_sal); mostrarModal('modal-editar-asistencia'); }));
  document.querySelectorAll('[data-anular-asistencia]').forEach((b) => b.addEventListener('click', async () => { if (!confirmar('¿Anular este marcaje? No se borrará, quedará como inactivo.')) return; try { await actualizarAsistencia(b.dataset.anularAsistencia, { est_asi: 'i' }); toast('Marcaje anulado.'); window.location.reload(); } catch (error) { toast(error.message, 'error'); } }));
  document.getElementById('form-editar-asistencia')?.addEventListener('submit', async (e) => { e.preventDefault(); const f = leerFormulario(e.currentTarget); if (f['editar-salida'] && f['editar-salida'] < f['editar-llegada']) { toast('La salida debe ser posterior o igual a la llegada.', 'warning'); return; } try { const { horaLocalAISO } = await import('../lib/format.js'); await actualizarAsistencia(f['editar-id'], { fec_asi: f['editar-fecha'], hor_lleg: horaLocalAISO(f['editar-fecha'], f['editar-llegada']), hor_sal: f['editar-salida'] ? horaLocalAISO(f['editar-fecha'], f['editar-salida']) : null }); toast('Asistencia actualizada.'); ocultarModal('modal-editar-asistencia'); window.location.reload(); } catch (error) { toast(error.message, 'error'); } });
}
