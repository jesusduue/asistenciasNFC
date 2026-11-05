/* Cliente único de Supabase. Solo usa la URL y anon key públicas del proyecto. */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const configuración = globalThis.__SUPABASE_CONFIG__ || {};
const url = configuración.url || '';
const anonKey = configuración.anonKey || '';
export const configurado = Boolean(url && anonKey && !url.includes('tu-proyecto') && !anonKey.includes('tu-clave'));
export const supabase = configurado ? createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }) : null;
export function exigirSupabase() { if (!supabase) throw new Error('Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY para conectar la aplicación.'); return supabase; }
export function mensajeError(error, alternativo = 'No fue posible completar la operación.') { return error?.message || error?.details || error?.hint || alternativo; }
