# Plan de implementación — Asistencia UPTNTS

## Enfoque

Construir una SPA estática mobile-first con HTML5, Tailwind compilado durante el build y módulos ES6 vanilla. La aplicación se conecta directamente a Supabase mediante `@supabase/supabase-js@2`; no se crea backend propio ni se recrea el esquema existente. El cliente mantiene un estado de sesión pequeño, escucha cambios de autenticación y aplica permisos tanto en el menú como en el enrutador y las acciones visibles.

La aplicación se entrega usable aun sin credenciales: si faltan `VITE_SUPABASE_URL` o `VITE_SUPABASE_ANON_KEY`, se muestra una pantalla de configuración pendiente clara en lugar de fallar silenciosamente. Con las variables configuradas, el flujo real de Auth, RPC y CRUD queda conectado a las tablas y objetos descritos en el brief.

## Alcance funcional

1. Shell responsive con sidebar en escritorio, bottom-nav en móvil y header con usuario, rol, logout y breadcrumbs.
2. Login con Supabase Auth email/contraseña y validación de vínculo activo en `usuario`.
3. Dashboard con KPIs de hoy, desglose, barra de últimos siete días y últimos marcajes.
4. Marcaje de asistencia NFC mediante Web NFC + RPC y alternativa manual por persona/turno/tipo.
5. Asistencias con filtros, corrección de horas, anulación y alta de marcaje manual.
6. CRUD de personal, credenciales NFC, turnos, gremios y cargos; administración de usuarios y roles para admin.
7. Reportes tabulares con filtros y exportación CSV UTF-8 BOM, `;` y decimales con coma.
8. Estados de carga, vacíos, errores, confirmaciones, toasts y escapado XSS.

## Diseño

- **Movimiento:** dashboard administrativo cálido, sobrio y táctil, inspirado en materiales de tierra y madera pulida.
- **Principios:** lectura rápida en entrada, jerarquía clara, baja fricción, accesibilidad por contraste y feedback inmediato.
- **Filosofía cromática:** crema para reducir fatiga visual, café oscuro para autoridad y primario tierra para acciones; verde/amarillo/rojo se reservan para estado.
- **Paradigma:** navegación lateral persistente en escritorio y “cabina de control” con acciones grandes en móvil; las tablas se convierten en tarjetas.
- **Motivos:** rail lateral con marca UPTNTS, tarjetas con línea de acento, píldoras de estado y bloques de KPI de alto contraste.
- **Interacción:** toda acción destructiva se traduce a inactivación y pide confirmación; los estados se explican con texto, no solo color.
- **Animación:** transiciones cortas de 160–220ms, entrada suave de tarjetas, skeleton pulse durante carga y feedback de éxito sin movimiento excesivo.
- **Tipografía:** Urbanist 400/500/600; títulos compactos, métricas grandes y etiquetas con tracking moderado.
- **Esencia:** control de asistencia confiable para que vigilancia y RRHH trabajen con el mismo registro. Personalidad: cálida, rigurosa, directa.
- **Voz:** clara y operativa. Ejemplos: “Acerca la credencial para registrar la jornada” y “Todo en orden: el marcaje quedó guardado”.
- **Marca:** monograma “A” construido con dos barras redondeadas que sugieren entrada y salida dentro de un círculo de tierra.
- **Color propio:** `#6E473B`, café arcilla para acciones y navegación activa.

## Estructura

- `index.html`: shell, CDN, metadatos y entrada de la SPA.
- `tailwind.config.cjs` y `src/styles/generated.css`: compilación estática de estilos; no se usa `eval`/`unsafe-eval`.
- `src/main.js`: arranque, sesión, router y render global.
- `src/router.js`: mapa hash, guardas de auth/permisos y páginas.
- `src/lib`: Supabase, formato regional, permisos, NFC y API tipada por convenciones.
- `src/auth`: proveedor de sesión y guardas visuales.
- `src/components`: componentes HTML reutilizables y eventos.
- `src/pages`: vistas por ruta, con carga y manejo de errores local.
- `src/styles/tailwind.config.js`: referencia de tokens de diseño.
- `public/manus-routes.json`: manifiesto requerido por Preview.
- `sql`: complemento de Supabase documentado/placeholder si el SQL fuente no fue adjuntado.

## Flujo de construcción

Se implementará por capas: shell y utilidades, autenticación y router, marcaje y dashboard, operaciones CRUD, reportes, documentación y verificación estática. El dev server será un servidor HTTP estático mínimo en Node para Preview; no añadirá dependencias de runtime.

La política CSP permite únicamente los orígenes necesarios para la aplicación, Supabase, Lucide y las fuentes de Google. Tailwind no se ejecuta en el navegador.
