/* Reportes operativos: agrega horas, estados y métodos; exporta CSV compatible con Excel. */
import { listar } from '../lib/api.js';
import { fechaHoy, fechaHaceDías, formatearHoras, formatearHorasLargas, escaparHTML } from '../lib/format.js';
import { tarjeta, tabla, badge, boton, campo, selección, vacío, refrescarIconos, toast } from '../components/components.js';
import { encabezado } from './utils.js';

let contexto = { filas: [], resultado: [] };

export async function render() {
  const [filas, gremios, cargos, turnos] = await Promise.all([
    listar('asistencia', { select: 'id_asi,fky_per,fky_turno,fec_asi,hor_lleg,hor_sal,hor_tra,metodo,est_asi,personal:fky_per(id_per,ced_per,nom_per,cargo:fky_cargo(id_cargo,nom_cargo,gremio:fky_grem(id_grem,nom_grem))),turno:fky_turno(id_turno,nom_turno)', order: { campo: 'fec_asi', asc: false }, limit: 2000 }),
    listar('gremio', { select: 'id_grem,nom_grem', filtros: [['eq', 'est_grem', 'a']], order: { campo: 'nom_grem', asc: true } }),
    listar('cargo', { select: 'id_cargo,nom_cargo', filtros: [['eq', 'est_cargo', 'a']], order: { campo: 'nom_cargo', asc: true } }),
    listar('turno', { select: 'id_turno,nom_turno', filtros: [['eq', 'est_turno', 'a']], order: { campo: 'nom_turno', asc: true } })
  ]);
  contexto.filas = filas; contexto.resultado = filas;
  const filtros = tarjeta(`<form id="filtros-reportes" class="grid gap-3 md:grid-cols-2 xl:grid-cols-6">${campo({ id: 'reporte-desde', label: 'Desde', tipo: 'date', valor: fechaHaceDías(6) })}${campo({ id: 'reporte-hasta', label: 'Hasta', tipo: 'date', valor: fechaHoy() })}${selección({ id: 'reporte-gremio', label: 'Gremio', opciones: gremios.map((g) => ({ value: g.nom_grem, label: g.nom_grem })) })}${selección({ id: 'reporte-cargo', label: 'Cargo', opciones: cargos.map((c) => ({ value: c.nom_cargo, label: c.nom_cargo })) })}${selección({ id: 'reporte-turno', label: 'Turno', opciones: turnos.map((t) => ({ value: t.nom_turno, label: t.nom_turno })) })}${selección({ id: 'reporte-metodo', label: 'Método', opciones: ['nfc', 'qr', 'manual', 'web'].map((m) => ({ value: m, label: m.toUpperCase() })) })}<div class="md:col-span-2 xl:col-span-6">${boton('Actualizar reporte', { attrs: 'type="submit"', icon: 'refresh-cw' })}</div></form>`);
  return encabezado('Reportes', 'Filtra la jornada y exporta una vista para análisis.', boton('Exportar CSV', { tipo: 'secondary', icon: 'download', attrs: 'data-exportar-reportes' })) + filtros + `<div id="resultado-reportes" class="mt-6">${pintarResultado(filas)}</div>`;
}
function filtrar(filas, fd) {
  return filas.filter((f) => { const persona = f.personal || {}; const gremio = persona.cargo?.gremio?.nom_grem || ''; const cargo = persona.cargo?.nom_cargo || ''; return (!fd.get('reporte-desde') || f.fec_asi >= fd.get('reporte-desde')) && (!fd.get('reporte-hasta') || f.fec_asi <= fd.get('reporte-hasta')) && (!fd.get('reporte-gremio') || gremio === fd.get('reporte-gremio')) && (!fd.get('reporte-cargo') || cargo === fd.get('reporte-cargo')) && (!fd.get('reporte-turno') || f.turno?.nom_turno === fd.get('reporte-turno')) && (!fd.get('reporte-metodo') || f.metodo === fd.get('reporte-metodo')); });
}
function resumenEmpleados(filas) {
  const acumulado = {};
  filas.forEach((f) => { const nombre = f.personal?.nom_per || 'Sin nombre'; if (!acumulado[nombre]) acumulado[nombre] = { persona: nombre, cedula: f.personal?.ced_per || '', gremio: f.personal?.cargo?.gremio?.nom_grem || '—', jornadas: 0, horas: 0, pendientes: 0 }; acumulado[nombre].jornadas += f.est_asi === 'a' ? 1 : 0; acumulado[nombre].horas += Number(f.hor_tra) || 0; acumulado[nombre].pendientes += f.est_asi === 'a' && !f.hor_sal ? 1 : 0; });
  return Object.values(acumulado).sort((a, b) => b.horas - a.horas);
}
function pintarResultado(filas) {
  if (!filas.length) return vacío('Sin datos para este filtro', 'Ajusta el rango o los criterios del reporte.', 'bar-chart-3');
  const resumen = resumenEmpleados(filas);
  const porMetodo = filas.reduce((acumulado, f) => { const método = f.metodo || '—'; acumulado[método] = (acumulado[método] || 0) + 1; return acumulado; }, {});
  const horas = filas.reduce((suma, f) => suma + (Number(f.hor_tra) || 0), 0);
  const métricas = tarjeta(`<div class="grid gap-4 sm:grid-cols-3"><div><p class="text-xs font-semibold uppercase tracking-wide text-ink/50">Marcajes</p><p class="mt-1 text-2xl font-semibold">${filas.length}</p></div><div><p class="text-xs font-semibold uppercase tracking-wide text-ink/50">Horas acumuladas</p><p class="mt-1 text-2xl font-semibold">${formatearHoras(horas)}</p></div><div><p class="text-xs font-semibold uppercase tracking-wide text-ink/50">Sin salida</p><p class="mt-1 text-2xl font-semibold text-warning">${filas.filter((f) => f.est_asi === 'a' && !f.hor_sal).length}</p></div></div>`);
  const columnas = [
    { label: 'Empleado', render: (f) => `<div><p class="font-semibold">${escaparHTML(f.persona)}</p><p class="text-xs text-ink/50">${escaparHTML(f.cedula)} · ${escaparHTML(f.gremio)}</p></div>` },
    { label: 'Jornadas', campo: 'jornadas' },
    { label: 'Horas', render: (f) => `${formatearHoras(f.horas)}<span class="ml-2 text-xs text-ink/45">${formatearHorasLargas(f.horas)}</span>` },
    { label: 'Pendientes', render: (f) => f.pendientes ? badge(String(f.pendientes), 'warning') : badge('0', 'success') }
  ];
  const tablaHoras = tarjeta('<h3 class="mb-4 font-semibold">Horas por empleado</h3>' + tabla({ filas: resumen, clave: 'persona', columnas }));
  const métodosHTML = Object.entries(porMetodo).map(([método, cantidad]) => `<div class="flex items-center justify-between gap-3"><span class="text-sm">${escaparHTML(método)}</span>${badge(String(cantidad), método === 'nfc' ? 'info' : 'neutral')}</div>`).join('');
  const tarjetaMétodos = tarjeta('<h3 class="mb-4 font-semibold">Por método</h3><div class="space-y-3">' + métodosHTML + '</div>');
  return métricas + `<div class="mt-6 grid gap-6 xl:grid-cols-[1fr_.35fr]"><div>${tablaHoras}</div><div>${tarjetaMétodos}</div></div>`;
}
function csvDescargar(filas) { const filasCSV = filas.map((f) => [f.fec_asi, f.personal?.ced_per || '', f.personal?.nom_per || '', f.personal?.cargo?.gremio?.nom_grem || '', f.personal?.cargo?.nom_cargo || '', f.turno?.nom_turno || '', f.metodo || '', Number(f.hor_tra || 0).toFixed(2).replace('.', ','), f.hor_sal ? 'Completa' : 'Sin salida']); const csv = '\ufeff' + [['Fecha', 'Cédula', 'Empleado', 'Gremio', 'Cargo', 'Turno', 'Método', 'Horas', 'Estado'], ...filasCSV].map((fila) => fila.map((valor) => `"${String(valor).replace(/"/g, '""')}"`).join(';')).join('\r\n'); const enlace = document.createElement('a'); enlace.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); enlace.download = `reporte-asistencia-${fechaHoy()}.csv`; enlace.click(); URL.revokeObjectURL(enlace.href); }
export function enlazar() { refrescarIconos(); document.getElementById('filtros-reportes')?.addEventListener('submit', (evento) => { evento.preventDefault(); contexto.resultado = filtrar(contexto.filas, new FormData(evento.currentTarget)); document.getElementById('resultado-reportes').innerHTML = pintarResultado(contexto.resultado); refrescarIconos(); }); document.querySelector('[data-exportar-reportes]')?.addEventListener('click', () => { if (!contexto.resultado.length) { toast('No hay datos para exportar.', 'warning'); return; } csvDescargar(contexto.resultado); toast('CSV exportado.'); }); }
