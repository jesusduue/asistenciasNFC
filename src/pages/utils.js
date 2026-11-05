/* Helpers pequeños compartidos por las páginas para evitar HTML y validaciones duplicadas. */
import { escaparHTML, fechaHoy, formatearFecha, formatearHora, formatearHoras, formatearHorasLargas } from '../lib/format.js';
import { alerta, boton, campo, selección, tarjeta, badge, icono, modal, refrescarIconos, toast, ocultarModal } from '../components/components.js';
export { escaparHTML, fechaHoy, formatearFecha, formatearHora, formatearHoras, formatearHorasLargas, alerta, boton, campo, selección, tarjeta, badge, icono, modal, refrescarIconos, toast, ocultarModal };
export function encabezado(título, detalle, acciones = '') { return `<div class="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p class="text-sm font-semibold text-clay">Panel operativo</p><h2 class="mt-1 text-2xl font-semibold tracking-tight">${escaparHTML(título)}</h2><p class="mt-1 text-sm text-ink/55">${escaparHTML(detalle)}</p></div>${acciones ? `<div class="flex flex-wrap gap-2">${acciones}</div>` : ''}</div>`; }
export function filtroFecha(id, label, valor) { return campo({ id, label, tipo: 'date', valor, clase: 'min-w-[150px]' }); }
export function leerFormulario(formulario) { return Object.fromEntries(new FormData(formulario).entries()); }
export function confirmar(mensaje) { return window.confirm(mensaje); }
export function estadoActivo(valor) { return valor === 'a' ? badge('Activo', 'success') : badge('Inactivo', 'neutral'); }
export function valorSeguro(obj, ruta, alternativo = '') { return ruta.split('.').reduce((acc, clave) => acc?.[clave], obj) ?? alternativo; }
export function opciónEstado(valor = 'a') { return [{ value: 'a', label: 'Activo' }, { value: 'i', label: 'Inactivo' }].map((o) => ({ ...o, selected: o.value === valor })); }
export function barraProgreso(valor, máximo) { const ancho = máximo ? Math.max(3, Math.min(100, valor / máximo * 100)) : 3; return `<div class="h-2 overflow-hidden rounded-full bg-sand"><div class="h-full rounded-full bg-clay" style="width:${ancho}%"></div></div>`; }
