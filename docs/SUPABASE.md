# Puesta en marcha con Supabase

## Estado actual (15/11/2026)

Proyecto «E-Commerce» (organización 7.6), región us-west-2. Ya tenía una tabla ajena, `Products`, vacía y sin usuarios; no se tocó.

| Paso | Estado |
|---|---|
| Estructura, RLS y trigger (`schema.sql`) | **Aplicada** como migración `tecnocoop_schema` |
| Endurecimiento de funciones y políticas | **Aplicado** como migración `tecnocoop_endurecer_funciones_y_politicas` |
| Datos de prueba (`seed.sql`) | **Cargados**: 22 solicitudes, 22 clientes, 6 repuestos |
| `.env` con URL y clave pública | **Completo** (ignorado por git) |
| Usuarios y perfiles | **Creados** (4 cuentas `@tecnocoop.test`) y roles asignados con `db/perfiles.sql` |
| Pruebas con sesión de cada rol | **Aprobadas**: `npm run test:rls`, 15 de 15 |
| Prueba en la interfaz | **Aprobada** con los cuatro roles (ingreso, alta, avance, tablero, informe, bloqueo de rutas y botones por rol) |

**Pendiente de seguridad:** las cuentas de prueba usan una contraseña débil. Cambiala desde *Authentication → Users* antes de usar el sistema con datos reales, y revisá en *Authentication → Providers* que el registro público esté desactivado.

Comprobado contra el proyecto real, sin sesión: no se leen solicitudes (devuelve lista vacía), no se puede insertar (RLS lo rechaza) y no se puede llamar `rol_actual()`.
El chequeo de seguridad de Supabase deja un aviso, esperado: `rol_actual()` es llamable por usuarios con sesión y solo devuelve su propio rol.

Si algo quedó mal y hay que repetir, los pasos de abajo describen la instalación completa.

(Texto original de la guía:)
Lo que sí se verificó: `db/schema.sql` y `db/seed.sql` corren sin errores y las reglas de permisos pasan 19 casos en un Postgres local (`npm run test:rls:local`). Eso no reemplaza probar en Supabase.

## 1. Crear el proyecto

1. En <https://supabase.com> creá un proyecto nuevo (plan gratuito alcanza).
2. Anotá dos valores de *Project Settings → API*: **Project URL** y la clave **anon (public)**.
   **No uses ni copies la clave `service_role`**: tiene acceso total y no debe estar en este repositorio ni en el navegador.

## 2. Crear la estructura y los datos de prueba

En *SQL Editor* pegá y ejecutá **`db/setup.sql`** entero (es `schema.sql` + `seed.sql` en un solo paso):
tablas, claves, RLS, el trigger que valida los cambios de estado, 22 solicitudes y 6 repuestos ficticios.
Si el proyecto ya tiene tablas con esos nombres, el script se aborta sin cambiar nada.
Para mantenimiento se pueden usar por separado `schema.sql` y `seed.sql`.

## 3. Crear los usuarios

En *Authentication → Users → Add user* creá cuatro usuarios con contraseña (marcá *Auto Confirm*):

| Correo | Rol |
|---|---|
| `admin@tecnocoop.test` | admin |
| `recepcion@tecnocoop.test` | recepcion |
| `tecnico@tecnocoop.test` | tecnico |
| `consulta@tecnocoop.test` | consulta |

Usá una contraseña de prueba que NO reutilices de otro servicio, y no la escribas en el repositorio.
Después pegá y ejecutá `db/perfiles.sql`, que asigna el rol a cada usuario.

## 4. Conectar la app

```bash
cp .env.example .env     # completá VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
npm run dev
```

Con las variables cargadas desaparece el selector de roles simulados y se pide correo y contraseña.

## 5. Probar los permisos en la base (caso P12)

```bash
SUPABASE_URL=<url> SUPABASE_ANON_KEY=<anon> TEST_PASSWORD=<contraseña de prueba> npm run test:rls
```

El script comprueba, con cada rol, que la base rechaza lo que la interfaz ya oculta. Deja registros «RLS prueba» porque el historial no se puede borrar.

## Qué falta verificar después de esto

- Que el script de permisos pase completo.
- Entrar a la app con cada usuario y repetir los casos P1–P11 contra datos reales.
- Revisar en *Authentication → Providers* que el registro público de usuarios esté desactivado, para que nadie se cree una cuenta por su cuenta.
