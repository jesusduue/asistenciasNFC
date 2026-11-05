# Árbol de carpetas

```text
asistencia-uptnts/
├── index.html                         # Shell HTML, CDN y tema
├── config.js                          # Configuración pública generada localmente
├── vercel.json                        # Rewrite de la SPA
├── package.json                       # Comandos de desarrollo y validación
├── server.mjs                         # Servidor estático local/Preview
├── .env.example                       # Variables de Supabase
├── README.md                          # Instalación, Auth, NFC y Vercel
├── plan.md                            # Plan y decisiones de diseño
├── TODO.md                            # Resultados y criterios de entrega
├── ESTRUCTURA.md                      # Este árbol comentado
├── public/
│   └── manus-routes.json              # Manifiesto de rutas para Preview
├── sql/
│   └── complemento_supabase.sql       # Nota segura: no recrea el esquema existente
└── src/
    ├── main.js                        # Arranque, sesión y render global
    ├── router.js                      # Enrutado hash y páginas
    ├── auth/
    │   ├── AuthProvider.js             # Supabase Auth y perfil de negocio
    │   └── RutaProtegida.js             # Guardas visuales de permisos
    ├── components/
    │   ├── components.js               # UI reutilizable y estados
    │   └── layout.js                    # Shell responsive
    ├── lib/
    │   ├── supabase.js                 # Cliente y configuración
    │   ├── format.js                   # Fecha, hora, horas y escapado
    │   ├── permisos.js                 # Matriz de roles y menú
    │   ├── nfc.js                      # Web NFC y UID
    │   └── api.js                      # Wrappers CRUD/RPC
    ├── pages/                          # Vistas por ruta
    └── styles/
        └── app.css                     # Estilos responsive complementarios
```
