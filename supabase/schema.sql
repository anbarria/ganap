-- ============================================================
-- GANAP — Esquema de base de datos + control de acceso (RLS)
-- Copia y pega TODO este archivo en Supabase -> SQL Editor -> Run
-- ============================================================

-- 1. TABLAS -----------------------------------------------------

create table if not exists usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  email text unique not null,
  rol text not null default 'propietario' check (rol in ('superadmin','propietario','veterinario','capataz')),
  created_at timestamptz default now()
);

create table if not exists fincas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  ubicacion text,
  telefono text,
  propietario_id uuid references usuarios(id),
  created_at timestamptz default now()
);

create table if not exists usuario_finca (
  usuario_id uuid references usuarios(id) on delete cascade,
  finca_id uuid references fincas(id) on delete cascade,
  primary key (usuario_id, finca_id)
);

create table if not exists hatos (
  id uuid primary key default gen_random_uuid(),
  finca_id uuid not null references fincas(id) on delete cascade,
  nombre text not null,
  proposito text,
  created_at timestamptz default now()
);

create table if not exists animales (
  id uuid primary key default gen_random_uuid(),
  arete text unique not null,
  nombre text,
  especie text not null,
  raza text,
  sexo text not null,
  fecha_nacimiento date,
  peso_kg numeric,
  finca_id uuid not null references fincas(id),
  hato_id uuid references hatos(id),
  padre_id uuid references animales(id),
  madre_id uuid references animales(id),
  estado text default 'Activo',
  en_venta boolean default false,
  precio_venta numeric,
  descripcion_venta text,
  created_at timestamptz default now()
);

create table if not exists vacunas (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid not null references animales(id) on delete cascade,
  nombre text not null,
  fecha_aplicada date not null,
  proxima_fecha date,
  aplicado_por text,
  created_at timestamptz default now()
);

create table if not exists visitas_veterinarias (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid not null references animales(id) on delete cascade,
  fecha date not null,
  motivo text,
  diagnostico text,
  veterinario text,
  created_at timestamptz default now()
);

-- 2. FUNCIONES AUXILIARES (evitan recursión en RLS) -------------

create or replace function is_superadmin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from usuarios where id = auth.uid() and rol = 'superadmin');
$$;

create or replace function mis_finca_ids()
returns setof uuid
language sql
security definer
set search_path = public
as $$
  select finca_id from usuario_finca where usuario_id = auth.uid();
$$;

-- 3. ACTIVAR ROW LEVEL SECURITY -----------------------------------

alter table usuarios enable row level security;
alter table fincas enable row level security;
alter table usuario_finca enable row level security;
alter table hatos enable row level security;
alter table animales enable row level security;
alter table vacunas enable row level security;
alter table visitas_veterinarias enable row level security;

-- 4. POLÍTICAS ----------------------------------------------------

-- usuarios: cada quien ve su propia fila; superadmin ve todas;
-- además, se expone el propietario de una finca que tenga animales publicados en el Mercado
-- (para que los compradores puedan ver a quién contactar).
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
create policy "usuarios_insert_self" on usuarios
  for insert with check (id = auth.uid());
create policy "usuarios_update_self_or_admin" on usuarios
  for update using (id = auth.uid() or is_superadmin());

-- usuario_finca
create policy "usuario_finca_select" on usuario_finca
  for select using (usuario_id = auth.uid() or is_superadmin());
create policy "usuario_finca_insert" on usuario_finca
  for insert with check (usuario_id = auth.uid() or is_superadmin());

-- fincas: solo se ven las propias (o todas si eres superadmin);
-- también se expone el nombre/ubicación de una finca que tenga animales publicados en el Mercado
create policy "fincas_select" on fincas
  for select using (
    id in (select mis_finca_ids())
    or is_superadmin()
    or exists (select 1 from animales a where a.finca_id = fincas.id and a.en_venta = true)
  );
create policy "fincas_insert" on fincas
  for insert with check (auth.uid() is not null);
create policy "fincas_update" on fincas
  for update using (propietario_id = auth.uid() or is_superadmin());

-- hatos
create policy "hatos_select" on hatos
  for select using (finca_id in (select mis_finca_ids()) or is_superadmin());
create policy "hatos_insert" on hatos
  for insert with check (finca_id in (select mis_finca_ids()) or is_superadmin());

-- animales: aislados por finca, EXCEPTO los publicados en el Mercado (en_venta = true), que son públicos de lectura
create policy "animales_select" on animales
  for select using (finca_id in (select mis_finca_ids()) or is_superadmin() or en_venta = true);
create policy "animales_insert" on animales
  for insert with check (finca_id in (select mis_finca_ids()) or is_superadmin());
create policy "animales_update" on animales
  for update using (finca_id in (select mis_finca_ids()) or is_superadmin());

-- vacunas: acceso heredado del animal
create policy "vacunas_select" on vacunas
  for select using (
    is_superadmin() or exists (
      select 1 from animales a where a.id = vacunas.animal_id and a.finca_id in (select mis_finca_ids())
    )
  );
create policy "vacunas_insert" on vacunas
  for insert with check (
    is_superadmin() or exists (
      select 1 from animales a where a.id = vacunas.animal_id and a.finca_id in (select mis_finca_ids())
    )
  );

-- visitas_veterinarias: acceso heredado del animal
create policy "visitas_select" on visitas_veterinarias
  for select using (
    is_superadmin() or exists (
      select 1 from animales a where a.id = visitas_veterinarias.animal_id and a.finca_id in (select mis_finca_ids())
    )
  );
create policy "visitas_insert" on visitas_veterinarias
  for insert with check (
    is_superadmin() or exists (
      select 1 from animales a where a.id = visitas_veterinarias.animal_id and a.finca_id in (select mis_finca_ids())
    )
  );

-- 5. ÍNDICES ÚTILES -------------------------------------------------

create index if not exists idx_animales_finca on animales(finca_id);
create index if not exists idx_animales_hato on animales(hato_id);
create index if not exists idx_animales_en_venta on animales(en_venta) where en_venta = true;
create index if not exists idx_vacunas_proxima on vacunas(proxima_fecha);
create index if not exists idx_vacunas_animal on vacunas(animal_id);
create index if not exists idx_visitas_animal on visitas_veterinarias(animal_id);

-- ============================================================
-- LISTO. Después de correr este script:
-- 1. Ve a Authentication -> Providers y confirma que "Email" está activo.
-- 2. (Recomendado para tu piloto) En Authentication -> Providers -> Email,
--    puedes desactivar "Confirm email" para no depender de la verificación
--    por correo mientras pruebas. Actívalo de nuevo antes de tener clientes reales.
-- 3. Para crear tu primer usuario SUPERADMIN (tú, como dueño de GANAP):
--    a) Regístrate normalmente desde la app (quedarás como 'propietario').
--    b) En Table Editor -> usuarios, edita tu fila y cambia "rol" a 'superadmin'.
-- ============================================================
