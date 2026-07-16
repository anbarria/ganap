# GANAP — Sistema de gestión ganadera

Sistema completo para administrar fincas ganaderas: ganado multi-especie, pedigree, vacunación, visitas veterinarias, control de acceso por finca, y un módulo de Mercado para publicar animales en venta.

Este proyecto está listo para subir a GitHub, conectar a Supabase (base de datos + autenticación) y publicar en Vercel — **todo con planes gratuitos**.

---

## 0. Qué es cada cosa (por si es tu primera vez)

- **GitHub**: donde vive tu código.
- **Supabase**: tu base de datos (PostgreSQL) + login de usuarios, gratis hasta cierto volumen de uso.
- **Vercel**: donde se "publica" tu aplicación para que cualquiera la abra desde un link, gratis para proyectos personales/pequeños negocios.

---

## 1. Crear el proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta (puedes usar tu cuenta de GitHub).
2. Clic en **New Project**. Nómbralo `ganap` (o `ganap-produccion`). Elige una contraseña de base de datos segura y guárdala.
3. Espera 1-2 minutos a que el proyecto termine de crearse.
4. Ve a **SQL Editor** (menú lateral) → **New query**.
5. Abre el archivo `supabase/schema.sql` de este proyecto, copia **todo** su contenido, pégalo en el editor y presiona **Run**.
   - Deberías ver "Success. No rows returned". Si hay un error, léelo con calma — normalmente indica una línea específica.
6. Ve a **Table Editor** y confirma que aparecen las tablas: `usuarios`, `fincas`, `usuario_finca`, `hatos`, `animales`, `vacunas`, `visitas_veterinarias`.
7. Ve a **Authentication → Providers** y confirma que "Email" está habilitado (lo está por defecto).
8. **Recomendado para tu piloto**: en **Authentication → Providers → Email**, puedes desactivar "Confirm email" temporalmente para no depender de la verificación por correo mientras pruebas tú mismo. Actívalo de nuevo antes de dar acceso a clientes reales.
9. Ve a **Project Settings → API** y copia dos valores, los necesitarás en el paso 3:
   - **Project URL**
   - **anon public key**

---

## 2. Probar el proyecto en tu computadora (opcional pero recomendado antes de publicar)

Necesitas [Node.js](https://nodejs.org) instalado (versión LTS).

```bash
npm install
cp .env.example .env.local
```

Abre `.env.local` y pega tus valores reales de Supabase del paso 1.9:

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

Luego:

```bash
npm run dev
```

Abre `http://localhost:3000` — debería llevarte a la pantalla de login. Crea una cuenta de prueba con "Crear cuenta".

---

## 3. Convertirte en superadmin (una sola vez)

1. Regístrate en la app (localmente o ya en producción) con tu propio correo — quedarás como `propietario` por defecto.
2. En Supabase → **Table Editor** → tabla `usuarios`, busca tu fila (por tu correo) y cambia la columna `rol` de `propietario` a `superadmin`.
3. Vuelve a la app y recarga — ahora verás la pestaña "Usuarios" y tendrás acceso a todas las fincas.

---

## 4. Subir el código a GitHub

Si nunca has usado Git:

```bash
git init
git add .
git commit -m "GANAP v1"
```

Crea un repositorio nuevo y vacío en [github.com/new](https://github.com/new) (llámalo `ganap`, no marques ninguna opción de inicializar con README). Luego:

```bash
git remote add origin https://github.com/TU-USUARIO/ganap.git
git branch -M main
git push -u origin main
```

`.env.local` **no se sube** (está en `.gitignore`), así que tus llaves reales quedan seguras.

---

## 5. Publicar en Vercel (gratis)

1. Ve a [vercel.com](https://vercel.com) y entra con tu cuenta de GitHub.
2. Clic en **Add New → Project**, selecciona el repositorio `ganap`.
3. En **Environment Variables**, agrega las mismas dos variables de tu `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Clic en **Deploy**. En 1-2 minutos tendrás una URL tipo `ganap-tuusuario.vercel.app`, ya funcionando en internet, gratis.
5. Abre esa URL desde tu teléfono y usa "Agregar a pantalla de inicio" en el navegador — la app se instala como si fuera una app nativa (es una PWA).

### Dominio propio (opcional, tiene costo aparte del hosting)

Si más adelante compras un dominio (ej. `ganap.app`), en Vercel ve a **Settings → Domains** y conéctalo. Luego, en Supabase → **Authentication → URL Configuration**, actualiza la URL del sitio a tu nuevo dominio.

---

## 6. Cómo funciona el control de acceso (para que confíes en él)

- Cada tabla tiene **Row Level Security** activado directamente en la base de datos (no en el código de la aplicación). Esto significa que aunque alguien manipule la aplicación desde las herramientas de desarrollador del navegador, la base de datos igual bloquea el acceso a datos de otras fincas.
- Un usuario `propietario` solo ve las fincas que están en la tabla `usuario_finca` vinculadas a su cuenta.
- Un usuario `superadmin` (tú) ve todo.
- El **Mercado** es la única excepción intencional: cualquier animal con `en_venta = true` es visible para todos los usuarios, junto con el nombre de la finca y el contacto del propietario — el resto de los datos de esa finca permanecen privados.

Revisa el archivo `supabase/schema.sql` completo para ver exactamente qué política aplica a cada tabla.

---

## 7. Estructura del proyecto

```
ganap/
├── app/
│   ├── login/page.js              → pantalla de inicio de sesión / registro
│   ├── dashboard/
│   │   ├── layout.js              → navegación (sidebar/menú móvil)
│   │   ├── page.js                → Inicio (resumen + alertas de vacunas)
│   │   ├── ganado/page.js         → lista de ganado + registrar animal
│   │   ├── ganado/[id]/page.js    → ficha del animal (pedigree, vacunas, mercado)
│   │   ├── fincas/page.js         → fincas y hatos
│   │   ├── mercado/page.js        → mercado público entre fincas
│   │   └── usuarios/page.js       → administración de usuarios (solo superadmin)
├── components/UI.jsx              → componentes visuales reutilizables
├── lib/
│   ├── supabase/client.js         → conexión a Supabase desde el navegador
│   ├── supabase/middleware.js     → mantiene la sesión activa
│   ├── useProfile.js              → obtiene el usuario y sus fincas
│   └── helpers.js                 → funciones de fecha y constantes
├── middleware.js                  → protege /dashboard si no has iniciado sesión
└── supabase/schema.sql            → TODO el esquema de base de datos + permisos
```

---

## 8. Qué falta para una versión más avanzada (no bloquea tu piloto)

- **Notificaciones automáticas** de vacunas por correo/SMS (hoy la alerta solo se ve dentro de la app al entrar).
- **Invitaciones por correo** para agregar un veterinario o capataz a tu finca (hoy se hace manualmente desde el Table Editor de Supabase, ver la pestaña "Usuarios" en la app).
- **Subida de fotos** de cada animal (hoy se muestra un ícono genérico).
- **Recuperar contraseña** (Supabase lo soporta, solo falta agregar la pantalla).

Ninguno de estos puntos es necesario para lanzar tu primer piloto con 1-2 fincas reales.

---

## 9. Costos

Con el uso de un piloto pequeño (1-5 fincas, decenas de animales), este proyecto corre completamente gratis en los planes gratuitos de Supabase y Vercel. Si tu operación crece mucho (miles de animales, muchos usuarios simultáneos), es cuando valdría la pena revisar los planes pagos de cualquiera de los dos servicios — pero no antes.
