# Asistencia UPTNTS

SPA administrativa de control de asistencia con credenciales NFC para la UPTNTS. Está construida con HTML, Tailwind compilado durante el build y JavaScript ES6 sin frameworks. Se conecta directamente a un proyecto Supabase existente.

## Configuración local

Requiere Node.js 18 o superior. Copia `.env.example` como `.env` y completa `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` con valores públicos de Supabase. No uses `service_role` en este frontend. Luego ejecuta:

```bash
npm run dev
```

Abre `http://localhost:3000`. El servidor genera `config.js` al arrancar a partir de `.env`. Si no completas las variables, puedes recorrer la interfaz y revisar el estado de configuración, pero el login y las consultas estarán desactivados.

Para generar los estilos antes de publicar, ejecuta `npm run build`. Tailwind ya no se carga desde `cdn.tailwindcss.com`: se compila a `src/styles/generated.css`, por lo que la aplicación no requiere `unsafe-eval` y funciona con una CSP estricta.

## Supabase y usuarios

La aplicación no recrea las tablas. Deben existir `rol`, `gremio`, `cargo`, `personal`, `usuario`, `turno`, `credencial_nfc`, `asistencia`, la RPC `fn_marcar_asistencia` y la vista `v_asistencia_hoy` descritas en el brief original. El archivo `sql/complemento_supabase.sql` es deliberadamente no destructivo porque el SQL fuente no estaba incluido en el material adjunto; revisa allí las notas antes de ejecutar scripts complementarios.

Para cargar datos de prueba relacionados, ejecuta `sql/datos_demo_supabase.sql` desde el SQL Editor de Supabase. El script es no destructivo y reejecutable: agrega cinco registros demo por tabla sin borrar los existentes. `usuario.auth_uid` queda `NULL` deliberadamente; después de crear las cuentas en Supabase Auth, vincula cada UUID real a su usuario demo.

Crea cada cuenta en Supabase Auth con email y contraseña desde el panel administrativo. Después vincula el UUID de `auth.users` en `usuario.auth_uid`, asigna `fky_rol`, `fky_per` cuando corresponda y deja `est_usu = 'a'`. El cliente consulta el vínculo por `auth_uid`; nunca valida `cla_usu` ni permite registro público. Configura RLS para que las políticas reales sean la barrera de seguridad.

Si `public.usuario` todavía no tiene `auth_uid`, ejecuta `sql/agregar_auth_uid.sql` antes de iniciar sesión. Ese script agrega la columna `uuid`, un índice y una clave foránea opcional hacia `auth.users(id)`. El UUID se encuentra en **Supabase → Authentication → Users**, columna `User UID`/`UUID`; no se debe copiar la contraseña.

Web NFC funciona solo con `NDEFReader` disponible, Chrome en Android y HTTPS. Cuando no esté disponible, la pantalla conserva el UID manual y el marcaje manual por persona.

## Vercel

Conecta este repositorio en Vercel como proyecto estático. Para una configuración simple usa **Build Command vacío** y **Output Directory `./`**; `vercel.json` contiene el rewrite de SPA. Como el frontend es estático, Vercel no sustituye automáticamente variables de entorno dentro del JavaScript: publica `config.js` con la URL y anon key públicas de tu proyecto, o adapta el pipeline para generar ese archivo desde `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. Nunca publiques la service role key.

En el proyecto de Vercel, asegúrate de servir `/config.js` con:

```js
window.__SUPABASE_CONFIG__ = {
  url: 'https://tu-proyecto.supabase.co',
  anonKey: 'tu-anon-key'
};
```

La URL pública debe usar HTTPS para permitir Web NFC. Revisa las políticas CORS y RLS de Supabase antes del primer uso en producción.

## Rutas y roles

`admin` tiene acceso total. `jefeRRHH` puede consultar dashboard, asistencias, personal, credenciales y reportes. `vigilante` puede marcar y consultar asistencias. Estas reglas solo controlan la interfaz; RLS debe imponerlas en Supabase.
