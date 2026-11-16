-- Registro de usuarios. Ejecutar en el SQL Editor de Supabase (una sola vez).
-- Quien se registra queda con rol 'pendiente': no ve ni modifica nada hasta que
-- un admin le asigne un rol real (update perfiles set rol = '...' where id = '...').
-- El rol nunca lo elige el usuario: lo fija este trigger.

alter table perfiles drop constraint perfiles_rol_check;
alter table perfiles add constraint perfiles_rol_check
  check (rol in ('admin','recepcion','tecnico','consulta','pendiente'));

-- 'pendiente' equivale a no tener rol: todas las políticas RLS lo rechazan.
create or replace function rol_actual() returns text language sql stable security definer
  set search_path = public
  as $$ select rol from perfiles where id = auth.uid() and rol <> 'pendiente' $$;

create or replace function crear_perfil_nuevo() returns trigger language plpgsql security definer
  set search_path = public
  as $$
begin
  insert into perfiles (id, nombre, rol)
  values (new.id, coalesce(nullif(trim(new.raw_user_meta_data->>'nombre'), ''), split_part(new.email, '@', 1)), 'pendiente')
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists auth_usuario_nuevo on auth.users;
create trigger auth_usuario_nuevo after insert on auth.users
  for each row execute function crear_perfil_nuevo();
