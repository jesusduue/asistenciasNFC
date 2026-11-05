/* Genera la configuración pública de Supabase durante el build estático. Nunca incluye service_role. */
import fs from 'node:fs';

function leerEnvLocal() {
  if (!fs.existsSync('.env')) return {};
  return Object.fromEntries(fs.readFileSync('.env', 'utf8').split(/\r?\n/).filter((línea) => línea && !línea.startsWith('#')).map((línea) => { const índice = línea.indexOf('='); return [línea.slice(0, índice).trim(), línea.slice(índice + 1).trim().replace(/^['"]|['"]$/g, '')]; }));
}
const local = leerEnvLocal();
const configuración = {
  url: process.env.VITE_SUPABASE_URL || local.VITE_SUPABASE_URL || '',
  anonKey: process.env.VITE_SUPABASE_ANON_KEY || local.VITE_SUPABASE_ANON_KEY || ''
};
fs.writeFileSync('config.js', `window.__SUPABASE_CONFIG__ = ${JSON.stringify(configuración)};\n`);
console.log(`config.js generado (${configuración.url ? 'URL configurada' : 'URL pendiente'}).`);
