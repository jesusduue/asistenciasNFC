/* Servidor estático mínimo para Preview y desarrollo local de Asistencia UPTNTS. */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raíz = path.dirname(fileURLToPath(import.meta.url));
const puerto = Number(process.env.PORT || 3000);
const tipos = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };

function cargarEntorno() {
  const archivo = path.join(raíz, '.env');
  if (!fs.existsSync(archivo)) return {};
  return Object.fromEntries(fs.readFileSync(archivo, 'utf8').split(/\r?\n/).filter((l) => l && !l.startsWith('#')).map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^['"]|['"]$/g, '')]; }));
}
function servir(ruta, respuesta) {
  const relativo = ruta === '/' ? '/index.html' : ruta;
  const seguro = path.normalize(relativo).replace(/^([.][.][/\\])+/, '');
  const archivo = path.join(raíz, seguro);
  if (!archivo.startsWith(raíz) || !fs.existsSync(archivo) || fs.statSync(archivo).isDirectory()) return false;
  respuesta.writeHead(200, { 'Content-Type': tipos[path.extname(archivo)] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'Content-Security-Policy': "default-src 'self'; script-src 'self' https://unpkg.com https://esm.sh; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://esm.sh; img-src 'self' data: blob:; object-src 'none'; base-uri 'self'" });
  respuesta.end(fs.readFileSync(archivo));
  return true;
}
const entorno = cargarEntorno();
const config = `window.__SUPABASE_CONFIG__ = ${JSON.stringify({ url: entorno.VITE_SUPABASE_URL || '', anonKey: entorno.VITE_SUPABASE_ANON_KEY || '' })};`;
fs.writeFileSync(path.join(raíz, 'config.js'), config);

http.createServer((solicitud, respuesta) => {
  const ruta = decodeURIComponent((solicitud.url || '/').split('?')[0]);
  if (ruta === '/health') { respuesta.writeHead(200, { 'Content-Type': 'application/json' }); respuesta.end('{"ok":true}'); return; }
  if (ruta === '/manus-routes.json') { servir('/public/manus-routes.json', respuesta); return; }
  if (!servir(ruta, respuesta)) servir('/index.html', respuesta);
}).listen(puerto, '0.0.0.0', () => console.log(`Asistencia UPTNTS escuchando en http://0.0.0.0:${puerto}`));
