# TecnoCoop

Precooperativa escolar de reparación de celulares, computadoras y pequeños electrodomésticos.
Vue 3 + Vite + Supabase.

## Estado

| Parte | Estado |
|---|---|
| Listado de solicitudes con filtro | Implementado con **datos de prueba** (`src/data/mock.js`) |
| Esquema SQL + RLS por rol | Diseñado en `db/schema.sql`, **sin ejecutar** aún |
| Formularios, tablero, informe, Supabase, autenticación | Pendiente |

## Correr

```bash
npm install
npm run dev
```

## Seguridad

Solo `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` van al cliente (ver `.env.example`).
La clave `service_role` nunca se guarda en este repo.
