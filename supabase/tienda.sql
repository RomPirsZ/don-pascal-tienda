-- Esquema de la tienda (plan §4). Se ejecuta una vez en el SQL Editor de Supabase.
-- Es la fuente única del esquema: los tests de src/lib comprueban que la app acepta lo
-- mismo que estos check.

-- Categorías del catálogo
create table public.categorias (
  id smallint generated always as identity primary key,
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,40}$'),
  nombre text not null check (char_length(nombre) between 2 and 40),
  orden smallint not null default 0
);

-- Productos. Los precios son ficticios (PRODUCT.md). Las fotos no van aquí: viven en el
-- repo con el mismo slug (src/assets/productos/), porque el build las optimiza.
create table public.productos (
  id integer generated always as identity primary key,
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,60}$'),
  nombre text not null check (char_length(nombre) between 2 and 80),
  categoria_id smallint not null references public.categorias (id),
  presentacion text not null check (char_length(presentacion) between 1 and 40),
  descripcion text not null default '' check (char_length(descripcion) <= 200),
  precio_usd numeric(10, 2) not null check (precio_usd > 0),
  -- Al mayor: precio por unidad a partir de `minimo_mayor` unidades
  precio_mayor_usd numeric(10, 2) check (precio_mayor_usd > 0 and precio_mayor_usd < precio_usd),
  minimo_mayor smallint check (minimo_mayor between 2 and 500),
  oferta_pct smallint check (oferta_pct between 5 and 70),
  disponible boolean not null default true,
  destacado boolean not null default false,
  palabras_clave text not null default '' check (char_length(palabras_clave) <= 200),
  -- Precio y mínimo al mayor van juntos
  check ((precio_mayor_usd is null) = (minimo_mayor is null))
);

-- Ajustes de la tienda. La tasa es de ejemplo y se rotula como tal.
create table public.ajustes (
  clave text primary key check (clave in ('tasa_bcv', 'tasa_fecha', 'horario', 'direccion')),
  valor text not null check (char_length(valor) between 1 and 200),
  check (clave <> 'tasa_bcv' or valor ~ '^[0-9]{1,6}(\.[0-9]{1,4})?$'),
  check (clave <> 'tasa_fecha' or valor ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$')
);

-- Mínimo privilegio (constitución V): desde la API pública el catálogo solo se lee.
alter table public.categorias enable row level security;
alter table public.productos enable row level security;
alter table public.ajustes enable row level security;

revoke all on table public.categorias, public.productos, public.ajustes
  from anon, authenticated;
grant select on table public.categorias, public.productos, public.ajustes to anon;

create policy "anon lee el catálogo" on public.categorias
  for select to anon using (true);
create policy "anon lee el catálogo" on public.productos
  for select to anon using (true);
create policy "anon lee los ajustes" on public.ajustes
  for select to anon using (true);

-- Tope diario del asistente (plan §6): una fila por respuesta, sin datos del cliente.
-- anon solo inserta el canal; nadie lee ni borra filas desde la API.
create table public.chat_uso (
  id uuid primary key default gen_random_uuid(),
  creado timestamptz not null default now(),
  canal text not null default 'web' check (canal in ('web', 'whatsapp'))
);

alter table public.chat_uso enable row level security;
revoke all on table public.chat_uso from anon, authenticated;
grant insert (canal) on table public.chat_uso to anon;

-- El Security Advisor avisa de este «with check (true)» (lint 0024): es intencional, como
-- la política de leads del portafolio. Solo se guarda el canal y la hora.
create policy "anon registra una respuesta" on public.chat_uso
  for insert to anon with check (true);

-- Cuántas respuestas dio el asistente en las últimas 24 horas. security definer porque
-- anon no puede leer chat_uso: solo devuelve el número. search_path vacío.
create or replace function public.chat_count_24h()
  returns integer
  language sql
  stable
  security definer
  set search_path = ''
  as $$
    select count(*)::integer
    from public.chat_uso
    where creado > now() - interval '24 hours'
  $$;

revoke execute on function public.chat_count_24h() from public, authenticated;
grant execute on function public.chat_count_24h() to anon;
