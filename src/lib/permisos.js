/* Reglas de autorización visual del frontend; la seguridad real debe estar en RLS. */
const PERMISOS = {
  admin: ['dashboard', 'marcar', 'asistencias', 'personal', 'credenciales', 'turnos', 'gremios', 'cargos', 'usuarios', 'roles', 'reportes'],
  jefeRRHH: ['dashboard', 'asistencias', 'personal', 'credenciales', 'reportes'],
  vigilante: ['marcar', 'asistencias']
};
export const RUTAS = {
  '/': 'dashboard', '/marcar': 'marcar', '/asistencias': 'asistencias', '/personal': 'personal', '/credenciales': 'credenciales', '/turnos': 'turnos', '/gremios': 'gremios', '/cargos': 'cargos', '/usuarios': 'usuarios', '/roles': 'roles', '/reportes': 'reportes'
};
export function normalizarRol(rol = '') { return String(rol).trim(); }
export function tienePermiso(rol, permiso) { return Boolean(PERMISOS[normalizarRol(rol)]?.includes(permiso)); }
export function rutasPermitidas(rol) { return Object.entries(RUTAS).filter(([, permiso]) => tienePermiso(rol, permiso)).map(([ruta]) => ruta); }
export function puede(rol, acción) { return tienePermiso(rol, acción); }
export const MENU = [
  { ruta: '/', permiso: 'dashboard', etiqueta: 'Resumen', icono: 'layout-dashboard' },
  { ruta: '/marcar', permiso: 'marcar', etiqueta: 'Marcar asistencia', icono: 'scan-line' },
  { ruta: '/asistencias', permiso: 'asistencias', etiqueta: 'Asistencias', icono: 'clipboard-check' },
  { ruta: '/personal', permiso: 'personal', etiqueta: 'Personal', icono: 'users' },
  { ruta: '/credenciales', permiso: 'credenciales', etiqueta: 'Credenciales', icono: 'contactless' },
  { ruta: '/reportes', permiso: 'reportes', etiqueta: 'Reportes', icono: 'bar-chart-3' },
  { ruta: '/turnos', permiso: 'turnos', etiqueta: 'Turnos', icono: 'clock-3' },
  { ruta: '/gremios', permiso: 'gremios', etiqueta: 'Gremios', icono: 'layers-3' },
  { ruta: '/cargos', permiso: 'cargos', etiqueta: 'Cargos', icono: 'briefcase-business' },
  { ruta: '/usuarios', permiso: 'usuarios', etiqueta: 'Usuarios', icono: 'user-cog' },
  { ruta: '/roles', permiso: 'roles', etiqueta: 'Roles', icono: 'shield-check' }
];
export function etiquetaRol(rol) { return ({ admin: 'Administrador', jefeRRHH: 'Jefe de RRHH', vigilante: 'Vigilante' }[rol] || rol || 'Sin rol'); }
