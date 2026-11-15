-- Ejecutar DESPUÉS de crear los 4 usuarios en Authentication > Users (ver docs/SUPABASE.md).
insert into perfiles (id, nombre, rol)
  select id, split_part(email, '@', 1),
         case split_part(email, '@', 1) when 'admin' then 'admin' when 'recepcion' then 'recepcion'
                                         when 'tecnico' then 'tecnico' else 'consulta' end
  from auth.users
  where email in ('admin@tecnocoop.test','recepcion@tecnocoop.test','tecnico@tecnocoop.test','consulta@tecnocoop.test');
