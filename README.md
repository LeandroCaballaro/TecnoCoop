# TecnoCoop

Precooperativa escolar de reparación de celulares, computadoras y pequeños electrodomésticos.
Vue 3 + Vite + Supabase. Informe completo en [`docs/INFORME.md`](docs/INFORME.md).

## Estado

| Parte | Estado |
|---|---|
| Solicitudes (alta, búsqueda, filtro, avance de estado, cancelación con motivo) | Implementado, con **datos y roles simulados** |
| Tablero (3 KPI con meta, 3 gráficos, filtros de período y categoría) | Implementado |
| Informe de seguimiento imprimible / PDF | Implementado; ejemplo en `docs/informe-seguimiento-periodo.pdf` |
| Esquema SQL + RLS por rol + trigger (`db/`) | **Aplicado en Supabase** con datos de prueba; probado también en Postgres local |
| Login real y permisos por rol | **Probados** en Supabase (15/15 casos de permisos; y la interfaz probada con los cuatro roles). Ver [`docs/SUPABASE.md`](docs/SUPABASE.md) |

## Correr

```bash
npm install
npm run dev
npm test
```

Sin variables `VITE_SUPABASE_*` la app usa datos ficticios en `localStorage` y un selector de rol sin contraseña.
Con ellas (ver `.env.example`) usa Supabase y exige correo y contraseña.

## Seguridad

Solo `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` van al cliente. La clave `service_role` nunca se guarda en este repo.

## Usuarios de prueba

Con Supabase se piden correo y contraseña. La contraseña de prueba **no se guarda en el repo**: la define quien crea los usuarios (ver [`docs/SUPABASE.md`](docs/SUPABASE.md)).

| Correo | Rol | Puede |
|---|---|---|
| `admin@tecnocoop.test` | Administración | Todo, incluido el informe |
| `recepcion@tecnocoop.test` | Recepción | Crear, avanzar y cancelar solicitudes; ver tablero |
| `tecnico@tecnocoop.test` | Técnico/a | Avanzar solicitudes; ver tablero |
| `consulta@tecnocoop.test` | Consulta | Solo ver tablero e informe |

Sin Supabase no hay usuarios: se elige el rol en pantalla.
