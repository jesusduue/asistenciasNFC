/* Prepara la salida estática de la SPA y genera la configuración pública de Supabase. */
import fs from 'node:fs';
import path from 'node:path';

function leerEnvLocal() {
  if (!fs.existsSync('.env')) return {};
  return Object.fromEntries(
    fs.readFileSync('.env', 'utf8')
      .split(/\r?\n/)
      .filter((línea) => línea && !línea.startsWith('#'))
      .map((línea) => {
        const índice = línea.indexOf('=');
        return [línea.slice(0, índice).trim(), línea.slice(índice + 1).trim().replace(/^['"]|['"]$/g, '')];
      }),
  );
}

function leerConfiguraciónActual() {
  if (!fs.existsSync('config.js')) return {};
  const contenido = fs.readFileSync('config.js', 'utf8');
  const coincidencia = contenido.match(/window\.__SUPABASE_CONFIG__\s*=\s*(\{.*\});/s);
  if (!coincidencia) return {};
  try { return JSON.parse(coincidencia[1]); } catch { return {}; }
}

function copiar(origen, destino) {
  fs.cpSync(origen, destino, { recursive: true });
}

const local = leerEnvLocal();
const actual = leerConfiguraciónActual();
const configuración = {
  // Las variables de Vercel tienen prioridad; el config.js versionado es un
  // respaldo para no romper despliegues si aún no se han creado en Vercel.
  url: process.env.VITE_SUPABASE_URL || local.VITE_SUPABASE_URL || actual.url || '',
  anonKey: process.env.VITE_SUPABASE_ANON_KEY || local.VITE_SUPABASE_ANON_KEY || actual.anonKey || '',
};

fs.rmSync('dist', { recursive: true, force: true });
fs.mkdirSync('dist', { recursive: true });
copiar('index.html', path.join('dist', 'index.html'));
copiar('src', path.join('dist', 'src'));
if (fs.existsSync('public')) copiar('public', path.join('dist', 'public'));
fs.writeFileSync('dist/config.js', `window.__SUPABASE_CONFIG__ = ${JSON.stringify(configuración)};\n`);

console.log(`dist generado (${configuración.url ? 'Supabase configurado' : 'Supabase pendiente'}).`);
