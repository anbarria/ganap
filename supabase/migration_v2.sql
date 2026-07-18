-- ============================================================
-- GANAP — Migración v2
-- Corre esto DESPUÉS del schema.sql original (no lo reemplaza).
-- Copia y pega TODO este archivo en Supabase -> SQL Editor -> Run
-- ============================================================

-- 1. NUEVAS COLUMNAS -----------------------------------------------

alter table usuarios add column if not exists telefono text;

alter table usuarios drop constraint if exists usuarios_rol_check;
alter table usuarios add constraint usuarios_rol_check
  check (rol in ('superadmin','propietario','administrador','veterinario','capataz'));

alter table animales add column if not exists foto_url text;
alter table animales add column if not exists propositos text[] default '{}';
alter table animales add column if not exists razas text[] default '{}';
alter table animales add column if not exists fecha_salida date;
alter table animales add column if not exists motivo_salida text;   -- 'Venta','Préstamo','Fallecimiento','Otro'
alter table animales add column if not exists destino_salida text;  -- descripción libre (comprador, finca destino, etc.)

-- 2. SOLUCIÓN DEFINITIVA A LA RECURSIÓN -----------------------------
-- En vez de que las políticas de "usuarios" vuelvan a consultar la propia
-- tabla "usuarios" (lo que causaba el ciclo infinito), el rol de cada
-- persona se guarda como un "claim" dentro de su token de sesión (JWT)
-- en el momento de iniciar sesión. Así, comprobar el rol nunca necesita
-- volver a consultar la tabla protegida por RLS.

create or replace function custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  claims jsonb;
  user_role text;
begin
  select rol into user_role from public.usuarios where id = (event->>'user_id')::uuid;
  claims := event->'claims';
  if user_role is not null then
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
  else
    claims := jsonb_set(claims, '{user_role}', '"propietario"');
  end if;
  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$$;

grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook from authenticated, anon, public;

-- is_superadmin ya NO consulta ninguna tabla: solo lee el claim del JWT.
create or replace function is_superadmin()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'user_role', '') = 'superadmin';
$$;

-- 3. POLÍTICAS ACTUALIZADAS (usuarios) -------------------------------

drop policy if exists "usuarios_select" on usuarios;
create policy "usuarios_select" on usuarios
  for select using (
    id = auth.uid()
    or is_superadmin()
    or exists (
      select 1 from fincas f
      join animales a on a.finca_id = f.id
      where f.propietario_id = usuarios.id and a.en_venta = true
    )
  );

-- Nueva: cualquier usuario puede ver a sus "compañeros de finca"
-- (necesario para el módulo Usuarios: ver quién más trabaja en tu finca)
drop policy if exists "usuarios_select_finca_mates" on usuarios;
create policy "usuarios_select_finca_mates" on usuarios
  for select using (
    exists (
      select 1 from usuario_finca uf1
      join usuario_finca uf2 on uf1.finca_id = uf2.finca_id
      where uf1.usuario_id = auth.uid() and uf2.usuario_id = usuarios.id
    )
  );

-- 4. BUCKET DE ALMACENAMIENTO PARA FOTOS DE ANIMALES ------------------

insert into storage.buckets (id, name, public)
values ('fotos-animales', 'fotos-animales', true)
on conflict (id) do nothing;

drop policy if exists "fotos_animales_insert" on storage.objects;
create policy "fotos_animales_insert" on storage.objects
  for insert with check (bucket_id = 'fotos-animales' and auth.role() = 'authenticated');

drop policy if exists "fotos_animales_select" on storage.objects;
create policy "fotos_animales_select" on storage.objects
  for select using (bucket_id = 'fotos-animales');

-- ============================================================
-- PASO MANUAL OBLIGATORIO (fuera de SQL):
-- Ve a Authentication -> Hooks (puede llamarse "Auth Hooks" según tu
-- versión de Supabase) -> activa "Custom Access Token" -> selecciona
-- la función: custom_access_token_hook
--
-- Sin este paso, la función existe pero Supabase nunca la usa al
-- iniciar sesión, y el claim "user_role" no llegará al token.
--
-- IMPORTANTE: como el rol ahora viaja dentro del token, cualquier
-- cambio de rol de un usuario requiere que esa persona cierre sesión
-- y vuelva a entrar para que el nuevo rol se refleje.
-- ============================================================
