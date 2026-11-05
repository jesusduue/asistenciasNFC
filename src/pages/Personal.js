/* Directorio de personal: alta, edición e inactivación sin borrar dependencias. */
import { listar, insertar, actualizar } from '../lib/api.js';
import { escaparHTML } from '../lib/format.js';
import { tabla, tarjeta, badge, boton, campo, selección, modal, mostrarModal, ocultarModal, vacío, icono, refrescarIconos, toast } from '../components/components.js';
import { encabezado, leerFormulario, confirmar } from './utils.js';

let contexto = { filas: [], cargos: [] };

function opcionesCargos(cargos) { return cargos.map((cargo) => ({ value: cargo.id_cargo, label: `${cargo.nom_cargo} · ${cargo.gremio?.nom_grem || 'Sin gremio'}` })); }
function pintarTabla(filas) {
  if (!filas.length) return vacío('No hay personal', 'Agrega la primera persona para comenzar.', 'users');
  return tabla({ filas, clave: 'id_per', columnas: [
    { label: 'Persona', render: (f) => `<div><p class="font-semibold">${escaparHTML(f.nom_per)}</p><p class="text-xs text-ink/50">${escaparHTML(f.ced_per)}</p></div>` },
    { label: 'Gremio', render: (f) => escaparHTML(f.cargo?.gremio?.nom_grem || '—') },
    { label: 'Cargo', render: (f) => escaparHTML(f.cargo?.nom_cargo || '—') },
    { label: 'Estado', render: (f) => f.est_per === 'a' ? badge('Activo', 'success') : badge('Inactivo', 'neutral') },
    { label: 'Acciones', render: (f) => `<div class="flex justify-end gap-1"><button data-editar-personal="${f.id_per}" class="rounded-xl p-2 text-clay hover:bg-sand">${icono('pencil')}</button>${f.est_per === 'a' ? `<button data-inactivar-personal="${f.id_per}" class="rounded-xl p-2 text-error hover:bg-[#F8E0DB]">${icono('user-round-x')}</button>` : ''}</div>` }
  ] });
}
function pintarModal(cargos) {
  return modal({ título: 'Personal', id: 'modal-personal', cuerpo: `<form id="form-personal" class="space-y-4"><input type="hidden" id="personal-id" />${campo({ id: 'personal-cedula', label: 'Cédula', placeholder: 'V-12345678', required: true })}${campo({ id: 'personal-nombre', label: 'Nombre completo', placeholder: 'Nombre y apellido', required: true })}${selección({ id: 'personal-cargo', label: 'Cargo', opciones: opcionesCargos(cargos), required: true })}${selección({ id: 'personal-estado', label: 'Estado', opciones: [{ value: 'a', label: 'Activo' }, { value: 'i', label: 'Inactivo' }], valor: 'a' })}<div class="flex justify-end gap-2">${boton('Cancelar', { tipo: 'secondary', attrs: 'data-cerrar-modal="modal-personal"' })}${boton('Guardar persona', { attrs: 'type="submit"', icon: 'save' })}</div></form>` });
}
export async function render() {
  const [filas, cargos] = await Promise.all([
    listar('personal', { select: 'id_per,ced_per,nom_per,fky_cargo,est_per,cargo:fky_cargo(id_cargo,nom_cargo,gremio:fky_grem(id_grem,nom_grem))', order: { campo: 'nom_per', asc: true } }),
    listar('cargo', { select: 'id_cargo,nom_cargo,fky_grem,gremio:fky_grem(id_grem,nom_grem)', filtros: [['eq', 'est_cargo', 'a']], order: { campo: 'nom_cargo', asc: true } })
  ]);
  contexto = { filas, cargos };
  const contenido = tarjeta(`<div class="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h3 class="font-semibold">Personas registradas</h3><p class="mt-1 text-xs text-ink/55">La cédula es única y el cargo determina el gremio.</p></div>${badge(`${filas.filter((f) => f.est_per === 'a').length} activos`, 'success')}</div>${pintarTabla(filas)}`);
  return encabezado('Personal', 'Directorio de docentes, obreros y administrativos.', boton('Agregar personal', { icon: 'user-plus', attrs: 'data-nuevo-personal' })) + contenido + pintarModal(cargos);
}
export function enlazar() {
  refrescarIconos();
  document.querySelector('[data-nuevo-personal]')?.addEventListener('click', () => { document.getElementById('form-personal')?.reset(); document.getElementById('personal-id').value = ''; mostrarModal('modal-personal'); });
  document.querySelectorAll('[data-editar-personal]').forEach((botón) => botón.addEventListener('click', () => { const persona = contexto.filas.find((f) => String(f.id_per) === botón.dataset.editarPersonal); if (!persona) return; document.getElementById('personal-id').value = persona.id_per; document.getElementById('personal-cedula').value = persona.ced_per; document.getElementById('personal-nombre').value = persona.nom_per; document.getElementById('personal-cargo').value = persona.fky_cargo; document.getElementById('personal-estado').value = persona.est_per; mostrarModal('modal-personal'); }));
  document.querySelectorAll('[data-inactivar-personal]').forEach((botón) => botón.addEventListener('click', async () => { if (!confirmar('¿Inactivar esta persona? Sus registros históricos se conservarán.')) return; try { await actualizar('personal', 'id_per', botón.dataset.inactivarPersonal, { est_per: 'i' }); toast('Personal inactivado.'); window.location.reload(); } catch (error) { toast(error.message, 'error'); } }));
  document.getElementById('form-personal')?.addEventListener('submit', async (evento) => { evento.preventDefault(); const datosFormulario = leerFormulario(evento.currentTarget); const datos = { ced_per: datosFormulario['personal-cedula'].trim(), nom_per: datosFormulario['personal-nombre'].trim(), fky_cargo: datosFormulario['personal-cargo'], est_per: datosFormulario['personal-estado'] || 'a' }; const botón = evento.currentTarget.querySelector('button[type="submit"]'); botón.disabled = true; try { if (datosFormulario['personal-id']) await actualizar('personal', 'id_per', datosFormulario['personal-id'], datos); else await insertar('personal', datos); toast('Personal guardado.'); ocultarModal('modal-personal'); window.location.reload(); } catch (error) { toast(error.message, 'error'); } finally { botón.disabled = false; } });
}
