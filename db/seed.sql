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
-- insert into perfiles (id, nombre, rol)
--   select id, split_part(email, '@', 1), case split_part(email, '@', 1)
--     when 'admin' then 'admin' when 'recepcion' then 'recepcion'
--     when 'tecnico' then 'tecnico' else 'consulta' end
--   from auth.users where email in ('admin@tecnocoop.test', 'recepcion@tecnocoop.test', 'tecnico@tecnocoop.test', 'consulta@tecnocoop.test');
