-- ============================================================
--  Colegio San Andrés — Esquema de base de datos (Supabase)
-- ------------------------------------------------------------
--  Cómo usarlo:
--    1. Entra a tu proyecto en https://supabase.com
--    2. Menú "SQL Editor" → "New query"
--    3. Pega TODO este archivo y presiona "Run".
--    4. Copia la URL y la anon key (Project Settings → API)
--       en el archivo .env (ver .env.example).
--
--  Los nombres de tabla y de columna coinciden EXACTAMENTE con
--  los que usa el frontend (src/lib/db.js y src/data/seed.js),
--  así no hay que tocar el código: solo pegar credenciales.
-- ============================================================

-- Extensión para generar UUIDs
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- 1. usuarios  (login: admin / maestro / aprobador)
-- ------------------------------------------------------------
create table if not exists usuarios (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  usuario     text not null unique,
  pass        text not null,            -- ⚠ ver nota de seguridad al final
  rol         text not null check (rol in ('admin','maestro','aprobador')),
  email       text,
  created_at  timestamptz default now()
);

-- ------------------------------------------------------------
-- 2. representantes  (parent — puede tener varios alumnos)
-- ------------------------------------------------------------
create table if not exists representantes (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  apellido    text,
  cedula      text,
  telefono    text,
  email       text,
  parentesco  text,
  created_at  timestamptz default now()
);

-- ------------------------------------------------------------
-- 3. alumnos  (child — vinculado a un representante)
-- ------------------------------------------------------------
create table if not exists alumnos (
  id               uuid primary key default gen_random_uuid(),
  nombre           text not null,
  apellido         text,
  cedula           text,
  nivel            text,                -- Primaria / Secundaria
  grado            text,
  seccion          text,
  representante_id uuid references representantes(id) on delete set null,
  moroso           boolean default false,
  monto_deuda      numeric default 0,
  created_at       timestamptz default now()
);

-- ------------------------------------------------------------
-- 4. maestros  (puede tener un usuario de login asociado)
-- ------------------------------------------------------------
create table if not exists maestros (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  apellido    text,
  cedula      text,
  telefono    text,
  email       text,
  materia     text,
  nivel       text,
  usuario_id  uuid references usuarios(id) on delete set null,
  created_at  timestamptz default now()
);

-- ------------------------------------------------------------
-- 5. personal  (docentes, administrativos, obreros, etc.)
-- ------------------------------------------------------------
create table if not exists personal (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  apellido    text,
  cargo       text,
  tipo        text,                     -- Docente / Administrativo / Obrero / Directivo / Otro
  telefono    text,
  email       text,
  created_at  timestamptz default now()
);

-- ------------------------------------------------------------
-- 6. materias  (asignaturas; el maestro puede crear nuevas)
-- ------------------------------------------------------------
create table if not exists materias (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  color       text default '#2A2F6B',
  maestro_id  uuid references maestros(id) on delete cascade,
  created_at  timestamptz default now()
);

-- ------------------------------------------------------------
-- 7. planificaciones  (flujo de aprobación)
--    status: borrador -> pendiente -> correccion -> pendiente -> aprobada
-- ------------------------------------------------------------
create table if not exists planificaciones (
  id           uuid primary key default gen_random_uuid(),
  materia_id   uuid references materias(id) on delete cascade,
  maestro_id   uuid references maestros(id) on delete set null,
  titulo       text not null,
  fecha        date,
  contenido    text,
  color        text default '#2A2F6B',
  imagenes     jsonb default '[]'::jsonb,   -- arreglo de imágenes (base64 o URLs)
  aprobador_id uuid references usuarios(id) on delete set null,
  status       text default 'borrador'
               check (status in ('borrador','pendiente','correccion','aprobada')),
  correcciones text default '',
  created_at   timestamptz default now()
);

-- ------------------------------------------------------------
-- Índices útiles
-- ------------------------------------------------------------
create index if not exists idx_alumnos_representante on alumnos(representante_id);
create index if not exists idx_materias_maestro       on materias(maestro_id);
create index if not exists idx_plan_materia           on planificaciones(materia_id);
create index if not exists idx_plan_aprobador         on planificaciones(aprobador_id);
create index if not exists idx_plan_status            on planificaciones(status);

-- ============================================================
--  Datos semilla mínimos (usuarios de prueba)
--  Puedes borrar este bloque si vas a cargar todo desde la app.
-- ============================================================
insert into usuarios (nombre, usuario, pass, rol, email) values
  ('Ronald',        'Ronald',  '10101987',  'admin',     null),
  ('Laura Méndez',  'lmendez', 'maestro123','maestro',   'laura@colegio.edu'),
  ('Carlos Rivas',  'crivas',  'aprobar123','aprobador', 'carlos@colegio.edu')
on conflict (usuario) do nothing;

-- ============================================================
--  SEGURIDAD (leer antes de producción)
-- ------------------------------------------------------------
--  • Esta fase guarda la clave en texto plano en la tabla
--    `usuarios` para mantener el FE funcional sin backend de auth.
--    Para producción: migrar el login a **Supabase Auth** y eliminar
--    la columna `pass`. La validación debe hacerse del lado servidor.
--
--  • Row Level Security (RLS): Supabase la trae desactivada en
--    tablas nuevas. Mientras uses la anon key en el FE, cualquiera
--    con la key puede leer/escribir. Antes de salir a producción,
--    activa RLS y define políticas por rol. Ejemplo de arranque:
--
--      alter table alumnos enable row level security;
--      create policy "lectura autenticada" on alumnos
--        for select using ( auth.role() = 'authenticated' );
--
--    (Repetir por tabla / operación según tus reglas.)
-- ============================================================
