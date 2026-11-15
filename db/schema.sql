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
