-- TecnoCoop: instalación completa (estructura + datos de prueba) en UN solo paso.
-- Pegar entero en Supabase > SQL Editor > Run. Después crear los 4 usuarios y ejecutar db/perfiles.sql.
-- Se aborta sin cambiar nada si ya existe alguna tabla con estos nombres (por ejemplo en un proyecto ajeno).
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public'
      and table_name in ('perfiles','clientes','solicitudes','historial_estados','repuestos','solicitud_repuestos')
  ) then
    raise exception 'Ya existen tablas con nombres de TecnoCoop en este proyecto. No se ejecuta nada.';
  end if;
end $$;
-- Estructura TecnoCoop. Ejecutar en el SQL Editor de Supabase.
-- Roles: admin (presidencia/tesoreria), recepcion (secretaria/logistica),
--        tecnico, consulta (sindicatura). El cliente no tiene cuenta en v1.

create table perfiles (
  id uuid primary key references auth.users on delete cascade,
  nombre text not null,
  rol text not null check (rol in ('admin','recepcion','tecnico','consulta'))
);

create table clientes (
  id bigint generated always as identity primary key,
  nombre text not null,
  contacto text not null,
  tipo text not null check (tipo in ('alumno','docente','escuela','vecino','comercio'))
);

create table solicitudes (
  id bigint generated always as identity primary key,
  cliente_id bigint not null references clientes on delete restrict,
  tecnico_id uuid references perfiles,
  categoria text not null check (categoria in ('movil','informatica','electrodomestico')),
  equipo text not null,
  falla text not null,
  estado text not null default 'recibido'
    check (estado in ('recibido','en_diagnostico','presupuestado','en_reparacion','listo','entregado','cancelado')),
  resultado text check (resultado in ('reparado','no_reparable')),
  presupuesto numeric(10,2) check (presupuesto >= 0),
  cobrado numeric(10,2) check (cobrado >= 0),
  creada_en timestamptz not null default now(),
  entregada_en timestamptz
);

-- Historial: no se borra nada, se cancela y queda registro.
create table historial_estados (
  id bigint generated always as identity primary key,
  solicitud_id bigint not null references solicitudes on delete restrict,
  estado text not null,
  usuario_id uuid references perfiles,
  nota text,
  creado_en timestamptz not null default now()
);

create table repuestos (
  id bigint generated always as identity primary key,
  nombre text not null,
  stock integer not null default 0 check (stock >= 0),
  costo numeric(10,2) not null default 0 check (costo >= 0)
);

create table solicitud_repuestos (
  solicitud_id bigint references solicitudes on delete restrict,
  repuesto_id bigint references repuestos on delete restrict,
  cantidad integer not null check (cantidad > 0),
  primary key (solicitud_id, repuesto_id)
);

-- RLS: el permiso se aplica sobre los datos, no solo en la interfaz.
alter table perfiles enable row level security;
alter table clientes enable row level security;
alter table solicitudes enable row level security;
alter table historial_estados enable row level security;
alter table repuestos enable row level security;
alter table solicitud_repuestos enable row level security;

create function rol_actual() returns text language sql stable security definer
  set search_path = public
  as $$ select rol from perfiles where id = auth.uid() $$;

-- RLS decide por fila. Este trigger exige en la base lo que la interfaz ya restringe:
-- presupuesto y cobro solo de admin, secuencia de estados y quién puede cancelar.
create function validar_cambio_solicitud() returns trigger language plpgsql security definer
  set search_path = public as $$
declare r text := rol_actual();
begin
  if (new.presupuesto is distinct from old.presupuesto or new.cobrado is distinct from old.cobrado) and r <> 'admin' then
    raise exception 'Solo Administración puede cargar presupuesto y cobro';
  end if;
  if new.estado is distinct from old.estado then
    if new.estado = 'cancelado' then
      if old.estado in ('entregado','cancelado') then
        raise exception 'Una solicitud % no se puede cancelar', old.estado;
      end if;
      if r not in ('admin','recepcion') then
        raise exception 'Tu rol no puede cancelar solicitudes';
      end if;
    elsif not (
      (old.estado = 'recibido' and new.estado = 'en_diagnostico') or
      (old.estado = 'en_diagnostico' and new.estado = 'presupuestado') or
      (old.estado = 'presupuestado' and new.estado = 'en_reparacion') or
      (old.estado = 'en_reparacion' and new.estado = 'listo') or
      (old.estado = 'listo' and new.estado = 'entregado')
    ) then
      raise exception 'Transición de estado no permitida: % -> %', old.estado, new.estado;
    end if;
  end if;
  return new;
end $$;

create trigger solicitudes_validar before update on solicitudes
  for each row execute function validar_cambio_solicitud();

-- Endurecimiento (aviso del linter de Supabase): nadie sin sesión llama funciones por RPC;
-- el trigger no se invoca por API. Las políticas aplican solo a usuarios con sesión.
revoke execute on function validar_cambio_solicitud() from public, anon, authenticated;
revoke execute on function rol_actual() from public, anon;
grant execute on function rol_actual() to authenticated;

create policy "perfil propio" on perfiles for select to authenticated using (id = auth.uid() or rol_actual() = 'admin');

create policy "admin gestiona perfiles" on perfiles for all to authenticated using (rol_actual() = 'admin');

create policy "leer solicitudes" on solicitudes for select to authenticated using (rol_actual() is not null);
create policy "crear solicitudes" on solicitudes for insert to authenticated with check (rol_actual() in ('admin','recepcion'));
create policy "editar solicitudes" on solicitudes for update to authenticated using (rol_actual() in ('admin','recepcion','tecnico'));

create policy "leer clientes" on clientes for select to authenticated using (rol_actual() is not null);
create policy "escribir clientes" on clientes for all to authenticated using (rol_actual() in ('admin','recepcion'));

create policy "leer historial" on historial_estados for select to authenticated using (rol_actual() is not null);
create policy "escribir historial" on historial_estados for insert to authenticated with check (rol_actual() in ('admin','recepcion','tecnico'));

create policy "leer repuestos" on repuestos for select to authenticated using (rol_actual() is not null);
create policy "escribir repuestos" on repuestos for all to authenticated using (rol_actual() in ('admin','recepcion'));

create policy "leer uso repuestos" on solicitud_repuestos for select to authenticated using (rol_actual() is not null);
create policy "escribir uso repuestos" on solicitud_repuestos for all to authenticated using (rol_actual() in ('admin','tecnico'));

-- Datos FICTICIOS de prueba. Ejecutar después de schema.sql, en el SQL Editor (corre como postgres, sin RLS).
-- Las fechas son relativas al momento de ejecución.
do $$
declare d record; cid bigint;
begin
  for d in select * from (values
    ('Ana Pérez', 'alumno', 'movil', 'Celular', 'Pantalla rota', 'entregado', 'reparado', 41, 4),
    ('Escuela - Aula 3', 'escuela', 'informatica', 'PC de escritorio', 'Fuente quemada', 'entregado', 'reparado', 40, 6),
    ('Luis Gómez', 'vecino', 'electrodomestico', 'Pava eléctrica', 'No calienta', 'entregado', 'reparado', 38, 2),
    ('Marta Díaz', 'docente', 'informatica', 'Notebook', 'Lenta y con virus', 'entregado', 'reparado', 33, 3),
    ('Kiosco Sol', 'comercio', 'electrodomestico', 'Licuadora', 'El motor no gira', 'entregado', 'no_reparable', 32, 6),
    ('Pablo Ruiz', 'alumno', 'movil', 'Tablet', 'Batería hinchada', 'entregado', 'reparado', 31, 7),
    ('Escuela - Biblioteca', 'escuela', 'informatica', 'PC de escritorio', 'No arranca el sistema', 'entregado', 'reparado', 27, 4),
    ('Rosa Medina', 'vecino', 'electrodomestico', 'Ventilador', 'Hélice trabada', 'entregado', 'reparado', 26, 1),
    ('Sofía Luna', 'alumno', 'movil', 'Celular', 'No carga', 'entregado', 'reparado', 24, 7),
    ('Carlos Vega', 'vecino', 'informatica', 'Notebook', 'Disco dañado', 'entregado', 'no_reparable', 20, 9),
    ('Panadería Norte', 'comercio', 'electrodomestico', 'Tostadora', 'Resistencia cortada', 'entregado', 'reparado', 19, 3),
    ('Julia Paz', 'docente', 'movil', 'Celular', 'Pantalla rota', 'entregado', 'reparado', 17, 5),
    ('Escuela - Aula 5', 'escuela', 'informatica', 'Notebook', 'Falla de memoria RAM', 'entregado', 'reparado', 13, 4),
    ('Escuela - Sala Docentes', 'escuela', 'informatica', 'PC de escritorio', 'Sin conexión a internet', 'entregado', 'reparado', 6, 2),
    ('Diego Fava', 'alumno', 'electrodomestico', 'Plancha', 'Termostato roto', 'listo', 'reparado', 12, null),
    ('Elena Ríos', 'vecino', 'movil', 'Celular', 'Mojado, no enciende', 'en_reparacion', null, 11, null),
    ('Tomás Alba', 'alumno', 'informatica', 'PC de escritorio', 'Recalienta, cambio de pasta', 'en_reparacion', null, 9, null),
    ('Gimnasio Fénix', 'comercio', 'informatica', 'PC de escritorio', 'No enciende', 'presupuestado', null, 8, null),
    ('Nora Silva', 'docente', 'electrodomestico', 'Secador de pelo', 'Cable dañado', 'en_diagnostico', null, 5, null),
    ('Ana Pérez', 'alumno', 'movil', 'Tablet', 'Pantalla rota', 'recibido', null, 3, null),
    ('Luis Gómez', 'vecino', 'informatica', 'Notebook', 'El teclado no responde', 'recibido', null, 2, null),
    ('Mario Cruz', 'vecino', 'electrodomestico', 'Pava eléctrica', 'Pierde agua', 'cancelado', null, 10, null)
  ) as t(cliente, tipo, categoria, equipo, falla, estado, resultado, atras, dias)
  loop
    insert into clientes (nombre, contacto, tipo)
      values (d.cliente, 'contacto-ficticio@example.com', d.tipo) returning id into cid;
    insert into solicitudes (cliente_id, categoria, equipo, falla, estado, resultado, creada_en, entregada_en)
      values (cid, d.categoria, d.equipo, d.falla, d.estado, d.resultado,
              now() - make_interval(days => d.atras),
              case when d.dias is null then null else now() - make_interval(days => d.atras - d.dias) end);
  end loop;
end $$;

insert into repuestos (nombre, stock, costo) values
  ('Fuente ATX 500W', 3, 9000), ('Memoria RAM 8GB', 4, 12000), ('Pantalla genérica celular', 2, 15000),
  ('Batería celular', 5, 7000), ('Resistencia para pava', 6, 2500), ('Cable de alimentación', 10, 1500);

-- Perfiles: primero creá los 4 usuarios en Authentication > Users (ver docs/SUPABASE.md), después:
