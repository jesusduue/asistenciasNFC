# TODO — Asistencia UPTNTS

## Shell, navegación y diseño

- [x] SPA hash con rutas privadas, pantalla de login, pantalla de permiso denegado y shell responsive.
- [x] Paleta #291C0E, #6E473B, #A78D78, #BEB5A9, #E1D4C2, #F4E6D2, tarjetas blancas y Urbanist.
- [x] Sidebar desktop, bottom-nav móvil, header con nombre, rol y logout; menú filtrado por rol.
- [x] Estados de carga con skeleton, estados vacíos, alertas, toasts y confirmación antes de inactivar/eliminar.

## Autenticación y permisos

- [x] Login con `supabase.auth.signInWithPassword`; no validar `usuario.cla_usu` en navegador.
- [x] Cargar `usuario` por `auth_uid` con rol/personal; bloquear fila inexistente o inactiva y rol/personal inactivos.
- [x] Roles admin, jefeRRHH y vigilante con permisos en menú, rutas y botones.

## Asistencia

- [x] Dashboard con presentes, pendientes, promedio, ausentes, desglose por gremio/turno, últimos 7 días y últimos 10 marcajes.
- [x] NFC con `NDEFReader`, UID normalizado, RPC `fn_marcar_asistencia`, confirmación y feedback.
- [x] Marcaje manual por persona y tipo, escritura directa con `metodo = manual`, `fky_cred = null` y respeto del UNIQUE.
- [x] Asistencias con filtros, edición de llegada/salida, validación salida >= llegada, anulación e ingreso manual olvidado.

## Catálogos y administración

- [x] Personal CRUD con cédula única, nombre, cargo agrupado por gremio, estado y ficha.
- [x] Credenciales NFC con alta, vencimiento, observación, revocar/reactivar, alertas de 30 días y tok_nfc oculto.
- [x] Turnos CRUD y advertencia por solapamiento de turnos activos.
- [x] Gremios y cargos CRUD; cargos filtrables por gremio.
- [x] Usuarios y roles solo admin; vinculación `auth_uid` e instrucciones para crear Auth.

## Reportes y entrega

- [x] Reportes por rango, gremio, cargo, turno y método: horas por empleado, asistencia por agrupación, inasistencias, sin salida y resumen por método.
- [x] Exportación CSV UTF-8 BOM, separador `;`, decimales con coma.
- [x] `.env.example`, `README.md`, `vercel.json`, `package.json`, manifiesto de rutas y complemento SQL.
- [x] Verificación de estructura, manifiesto, arranque HTTP y diagnósticos sin errores accionables.
- [x] CSP segura sin `unsafe-eval`: Tailwind se compila en build y no se ejecuta el compilador CDN en el navegador.
