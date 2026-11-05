/* Acceso a datos: las páginas llaman estas funciones y no construyen consultas dispersas. */
import { exigirSupabase, mensajeError } from './supabase.js';
import { fechaHoy, horaLocalAISO } from './format.js';

async function resolver(promise) { const { data, error } = await promise; if (error) throw new Error(mensajeError(error)); return data; }
export async function listar(tabla, opciones = {}) {
  const db = exigirSupabase(); let consulta = db.from(tabla).select(opciones.select || '*');
  for (const filtro of opciones.filtros || []) { const [método, campo, valor] = filtro; consulta = consulta[método](campo, valor); }
  if (opciones.order) consulta = consulta.order(opciones.order.campo, { ascending: opciones.order.asc !== false });
  if (opciones.limit) consulta = consulta.limit(opciones.limit);
  return resolver(consulta);
}
export async function obtenerPorId(tabla, idCampo, id) { return resolver(exigirSupabase().from(tabla).select('*').eq(idCampo, id).maybeSingle()); }
export async function insertar(tabla, registro) { return resolver(exigirSupabase().from(tabla).insert(registro).select().single()); }
export async function actualizar(tabla, idCampo, id, registro) { return resolver(exigirSupabase().from(tabla).update(registro).eq(idCampo, id).select().single()); }
export async function inactivar(tabla, idCampo, id, campoEstado = 'est_' + tabla.slice(0, -1)) { return resolver(exigirSupabase().from(tabla).update({ [campoEstado]: 'i' }).eq(idCampo, id)); }
export async function eliminar(tabla, idCampo, id) { return resolver(exigirSupabase().from(tabla).delete().eq(idCampo, id)); }
export async function rpcMarcar(uid, tipo = 'auto') { return resolver(exigirSupabase().rpc('fn_marcar_asistencia', { p_uid_nfc: uid, p_tipo: tipo })); }
export async function obtenerPerfil(authUid) {
  const db = exigirSupabase();
  const conRelaciones = await db.from('usuario').select('id_usu, nom_usu, est_usu, auth_uid, fky_rol, fky_per, rol:fky_rol(id_rol, nom_rol, est_rol), personal:fky_per(id_per, ced_per, nom_per, est_per, cargo:fky_cargo(id_cargo, nom_cargo, est_cargo, gremio:fky_grem(id_grem, nom_grem, est_grem)))').eq('auth_uid', authUid).eq('est_usu', 'a').maybeSingle();
  if (!conRelaciones.error && conRelaciones.data) return conRelaciones.data;
  const simple = await db.from('usuario').select('*').eq('auth_uid', authUid).eq('est_usu', 'a').maybeSingle();
  if (simple.error) throw new Error(mensajeError(simple.error));
  if (!simple.data) return null;
  const rol = simple.data.fky_rol ? await obtenerPorId('rol', 'id_rol', simple.data.fky_rol) : null;
  const personal = simple.data.fky_per ? await obtenerPorId('personal', 'id_per', simple.data.fky_per) : null;
  return { ...simple.data, rol, personal };
}
export async function obtenerAsistenciasHoy() { return listar('v_asistencia_hoy', { order: { campo: 'hor_lleg', asc: false } }); }
export async function marcarManual({ idPer, idTurno, fecha = fechaHoy(), tipo, hora }) {
  const db = exigirSupabase();
  const existente = await db.from('asistencia').select('id_asi, hor_lleg, hor_sal').eq('fky_per', idPer).eq('fky_turno', idTurno).eq('fec_asi', fecha).maybeSingle();
  if (existente.error) throw new Error(mensajeError(existente.error));
  const momento = horaLocalAISO(fecha, hora);
  if (tipo === 'salida' && !existente.data) throw new Error('No existe una llegada para cerrar en este turno.');
  if (existente.data) {
    const cambios = tipo === 'salida' ? { hor_sal: momento, metodo: 'manual' } : { hor_lleg: momento, metodo: 'manual', fky_cred: null };
    return actualizar('asistencia', 'id_asi', existente.data.id_asi, cambios);
  }
  return insertar('asistencia', { fky_per: idPer, fky_turno: idTurno, fec_asi: fecha, hor_lleg: momento, hor_sal: null, fky_cred: null, metodo: 'manual', est_asi: 'a' });
}
export async function guardarAsistencia({ id, idPer, idTurno, fecha, llegada, salida, metodo = 'manual' }) {
  const datos = { fky_per: idPer, fky_turno: idTurno, fec_asi: fecha, hor_lleg: horaLocalAISO(fecha, llegada), hor_sal: salida ? horaLocalAISO(fecha, salida) : null, metodo, est_asi: 'a', fky_cred: null };
  return id ? actualizar('asistencia', 'id_asi', id, datos) : insertar('asistencia', datos);
}
export async function actualizarAsistencia(id, datos) { return actualizar('asistencia', 'id_asi', id, datos); }
export async function contar(tabla, filtros = []) { const db = exigirSupabase(); let q = db.from(tabla).select('*', { count: 'exact', head: true }); for (const [m, c, v] of filtros) q = q[m](c, v); const { count, error } = await q; if (error) throw new Error(mensajeError(error)); return count || 0; }
