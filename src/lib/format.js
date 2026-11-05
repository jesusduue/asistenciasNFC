/* Utilidades puras de formato para la zona America/Caracas y locale es-VE. */
const ZONA = 'America/Caracas';
const LOCALE = 'es-VE';

export function escaparHTML(valor = '') {
  return String(valor ?? '').replace(/[&<>"']/g, (carácter) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[carácter]));
}
export function formatearFecha(valor, incluirHora = false) {
  if (!valor) return '—';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return '—';
  return new Intl.DateTimeFormat(LOCALE, { timeZone: ZONA, day: '2-digit', month: '2-digit', year: 'numeric', ...(incluirHora ? { hour: '2-digit', minute: '2-digit', hour12: false } : {}) }).format(fecha);
}
export function formatearHora(valor) {
  if (!valor) return '—';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return String(valor).slice(0, 5);
  return new Intl.DateTimeFormat(LOCALE, { timeZone: ZONA, hour: '2-digit', minute: '2-digit', hour12: false }).format(fecha);
}
export function formatearHoras(valor) {
  const número = Number(valor);
  if (!Number.isFinite(número)) return '—';
  return `${número.toFixed(2).replace('.', ',')} h`;
}
export function formatearHorasLargas(valor) {
  const número = Number(valor);
  if (!Number.isFinite(número)) return '—';
  const horas = Math.floor(número);
  const minutos = Math.round((número - horas) * 60);
  return `${horas} h ${minutos} min`;
}
export function formatearNumero(valor, opciones = {}) {
  const número = Number(valor);
  return Number.isFinite(número) ? new Intl.NumberFormat(LOCALE, opciones).format(número) : '—';
}
export function parsearNumero(valor) {
  if (typeof valor === 'number') return valor;
  const normalizado = String(valor ?? '').trim().replace(/\./g, '').replace(',', '.');
  const número = Number(normalizado);
  return Number.isFinite(número) ? número : null;
}
export function fechaHoy() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
export function fechaHaceDías(días) {
  const fecha = new Date(); fecha.setDate(fecha.getDate() - días); return fecha.toISOString().slice(0, 10);
}
export function horaLocalAISO(fecha, hora) {
  if (!fecha || !hora) return null;
  return new Date(`${fecha}T${hora}:00-04:00`).toISOString();
}
export function horaParaInput(valor) {
  if (!valor) return '';
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? String(valor).slice(0, 5) : new Intl.DateTimeFormat('en-GB', { timeZone: ZONA, hour: '2-digit', minute: '2-digit', hour12: false }).format(fecha);
}
export function diferenciaHoras(inicio, fin) {
  if (!inicio || !fin) return null;
  const a = new Date(inicio).getTime(); const b = new Date(fin).getTime();
  return Number.isFinite(a) && Number.isFinite(b) ? Math.max(0, (b - a) / 3600000) : null;
}
