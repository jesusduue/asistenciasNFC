/* Integración opcional con Web NFC; el navegador siempre conserva entrada manual. */
export function nfcDisponible() { return typeof window !== 'undefined' && 'NDEFReader' in window && window.isSecureContext; }
export function normalizarUID(uid = '') { return String(uid).replace(/:/g, '').replace(/\s+/g, '').toUpperCase(); }
export async function leerUID(onEstado = () => {}) {
  if (!nfcDisponible()) throw new Error('Web NFC requiere Chrome en Android y una conexión HTTPS.');
  const lector = new window.NDEFReader();
  await lector.scan();
  onEstado('Acerca la credencial al teléfono…');
  return new Promise((resolve, reject) => {
    const terminar = (función) => { lector.onreading = null; lector.onerror = null; función(); };
    lector.onreading = (evento) => terminar(() => resolve(normalizarUID(evento.serialNumber)));
    lector.onerror = () => terminar(() => reject(new Error('No se pudo leer la credencial NFC.')));
  });
}
