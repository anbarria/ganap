# Desplegar la función "invite-user"

Esta función permite invitar veterinarios/administradores desde el módulo Usuarios.
Necesita el **Supabase CLI** (una sola vez) y se despliega en minutos, gratis.

## 1. Instalar el CLI de Supabase

```bash
npm install -g supabase
```

## 2. Iniciar sesión y vincular tu proyecto

```bash
supabase login
```

Se abrirá tu navegador para autorizar. Luego, desde la carpeta raíz de este proyecto:

```bash
supabase link --project-ref TU-PROJECT-REF
```

(El `project-ref` lo ves en la URL de tu proyecto en Supabase: `https://supabase.com/dashboard/project/TU-PROJECT-REF`)

## 3. Configurar el secreto (la llave de servicio NUNCA va en el código ni en GitHub)

En Supabase → Project Settings → API, copia la **`service_role` key** (distinta de la `anon` key).

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui
supabase secrets set SUPABASE_ANON_KEY=tu-anon-key-aqui
```

`SUPABASE_URL` ya está disponible automáticamente dentro de las funciones, no hace falta configurarla.

## 4. Desplegar

```bash
supabase functions deploy invite-user
```

Al terminar, verás una URL como:
```
https://TU-PROJECT-REF.supabase.co/functions/v1/invite-user
```

Esa es la URL que usa el botón "Invitar" del módulo Usuarios (ya está configurada en el código para construirla automáticamente a partir de tu `NEXT_PUBLIC_SUPABASE_URL`, no necesitas copiarla a mano).

## 5. Probar

Desde el módulo Usuarios en la app, invita a un correo de prueba. Esa persona recibirá un correo de Supabase con un enlace para crear su contraseña, y quedará automáticamente vinculada a tu finca con el rol que elegiste.

## Si no quieres usar la Función Edge todavía

Puedes seguir usando el método manual mientras tanto: crea la fila en `usuarios` y en `usuario_finca` directamente desde el Table Editor de Supabase, como se explicó anteriormente. El botón "Invitar" de la app no funcionará hasta que despliegues esta función.
