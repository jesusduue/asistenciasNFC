/* Genera la configuración pública de Supabase antes del bundle de Vite. */
import fs from 'node:fs';

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

const local = leerEnvLocal();
const actual = leerConfiguraciónActual();
const configuración = {
  // Vercel y .env tienen prioridad; el config.js versionado evita romper
  // despliegues si las variables aún no se han creado en Vercel.
  url: process.env.VITE_SUPABASE_URL || local.VITE_SUPABASE_URL || actual.url || '',
  anonKey: process.env.VITE_SUPABASE_ANON_KEY || local.VITE_SUPABASE_ANON_KEY || actual.anonKey || '',
};

fs.mkdirSync('public', { recursive: true });
fs.writeFileSync('public/config.js', `window.__SUPABASE_CONFIG__ = ${JSON.stringify(configuración)};\n`);
console.log(`config.js preparado para Vite (${configuración.url ? 'Supabase configurado' : 'Supabase pendiente'}).`);
