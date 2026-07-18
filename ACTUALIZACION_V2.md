# GANAP — Cómo aplicar la actualización v2

Esta actualización agrega: solución definitiva a la recursión de permisos, mostrar/ocultar
contraseña, restablecer contraseña, confirmación de correo, invitar veterinarios/administradores
por finca, teléfono en los perfiles, propósito y raza en selección múltiple, foto del animal,
registro de salidas (venta/préstamo/fallecimiento), y el módulo de Reportes.

Sigue estos pasos **en orden**.

---

## 1. Base de datos — corre la migración

1. Ve a Supabase → **SQL Editor** → **New query**
2. Copia y pega **todo** el contenido de `supabase/migration_v2.sql`
3. Presiona **Run**

Deberías ver "Success. No rows returned".

---

## 2. Activa el "Custom Access Token Hook" (paso manual obligatorio)

Esto es lo que hace definitiva la solución a la recursión — sin este paso, la migración
no tiene efecto.

1. Ve a **Authentication → Hooks** (en algunas versiones aparece como "Auth Hooks")
2. Busca **"Customize Access Token (JWT) Claims"** y actívalo
3. Selecciona la función: `custom_access_token_hook`
4. Guarda

**Importante:** todos los usuarios existentes (incluyéndote a ti) deben **cerrar sesión y
volver a entrar** después de este paso, para que su rol quede grabado en el nuevo token.

---

## 3. Confirma el bucket de fotos

La migración ya intentó crear el bucket `fotos-animales`. Ve a **Storage** en Supabase y
confirma que aparece. Si no aparece (a veces el SQL Editor no tiene permiso sobre `storage`),
créalo manualmente:
1. **Storage → New bucket**
2. Nombre: `fotos-animales`
3. Marca **Public bucket**
4. Crea

---

## 4. Re-activa la confirmación por correo (ahora que ya tienes el flujo completo)

1. **Authentication → Providers → Email**
2. Activa **"Confirm email"**
3. Guarda

---

## 5. Configura las URLs de redirección

1. **Authentication → URL Configuration**
2. En **Site URL**, pon la URL de tu app en producción (o `http://localhost:3000` mientras pruebas)
3. En **Redirect URLs**, agrega (una por línea):
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/actualizar-contrasena`
   - Y las mismas dos con tu dominio real de Vercel cuando lo tengas

---

## 6. (Opcional pero recomendado) Despliega la función de invitaciones

Sin este paso, el botón "Invitar persona" del módulo Usuarios mostrará un error explicando
que falta desplegar la función — el resto de la app funciona igual sin este paso.

Sigue `supabase/functions/invite-user/README.md` para desplegarla (toma unos 10 minutos,
requiere instalar el Supabase CLI una sola vez).

---

## 7. Actualiza tu código local y en GitHub

```bash
npm install   # por si algo cambió
npm run dev   # prueba localmente primero
```

Si todo se ve bien:

```bash
git add .
git commit -m "GANAP v2: invitaciones, reportes, fotos, propósito/raza, salidas"
git push
```

Vercel vuelve a desplegar automáticamente al recibir el push.

---

## Qué probar después de aplicar todo esto

- [ ] Cerraste sesión y volviste a entrar (para que tu rol de superadmin viaje en el token)
- [ ] En "Usuarios", invitaste a un correo de prueba y le llegó el correo (requiere el paso 6)
- [ ] Al registrar un animal, aparece el selector de Propósito y luego Raza filtrada por ese propósito
- [ ] Subiste una foto al registrar un animal y se ve en la lista y en su ficha
- [ ] Marcaste una "salida" (venta/préstamo) y el animal aparece en la pestaña "Salidas" de Ganado, y en Reportes
- [ ] "Olvidé mi contraseña" te envía el correo y el enlace te deja crear una nueva
- [ ] El ícono del ojo en el campo de contraseña muestra/oculta el texto
