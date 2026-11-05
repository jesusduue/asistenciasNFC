/* Verificación estática de todos los módulos de la SPA y del servidor. */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const raíz = process.cwd();
const archivos = [];
function recorrer(directorio) { for (const nombre of fs.readdirSync(directorio)) { const ruta = path.join(directorio, nombre); const stat = fs.statSync(ruta); if (stat.isDirectory() && !['.git', 'node_modules'].includes(nombre)) recorrer(ruta); else if (stat.isFile() && (ruta.endsWith('.js') || ruta.endsWith('.mjs'))) archivos.push(ruta); } }
recorrer(raíz);
for (const archivo of archivos) { const resultado = spawnSync(process.execPath, ['--check', archivo], { encoding: 'utf8' }); if (resultado.status !== 0) { process.stderr.write(resultado.stderr); process.exit(resultado.status || 1); } }
console.log(`Sintaxis OK: ${archivos.length} módulos.`);
