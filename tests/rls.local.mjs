// Valida db/schema.sql, db/seed.sql y las políticas RLS en un Postgres local (PGlite) con auth.uid() simulado.
// No es Supabase: complementa, no reemplaza, a tests/rls.e2e.mjs.
import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'

const raiz = new URL('../db/', import.meta.url)
const db = new PGlite()
await db.exec(`
  create schema auth;
  create table auth.users (id uuid primary key default gen_random_uuid(), email text);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create role authenticated; create role anon;
`)
await db.exec(readFileSync(new URL('schema.sql', raiz), 'utf8'))
await db.exec(`grant usage on schema public, auth to authenticated, anon;
  grant all on all tables in schema public to authenticated; grant all on all sequences in schema public to authenticated;
  grant select on all tables in schema public to anon; grant execute on function rol_actual() to authenticated;`)
await db.exec(readFileSync(new URL('seed.sql', raiz), 'utf8'))
const n = await db.query('select count(*)::int n from solicitudes')
console.log('seed: solicitudes =', n.rows[0].n)

const ids = {}
for (const rol of ['admin', 'recepcion', 'tecnico', 'consulta']) {
  const r = await db.query(`insert into auth.users(email) values ($1) returning id`, [`${rol}@tecnocoop.test`])
  ids[rol] = r.rows[0].id
}
// el insert comentado del seed, ejecutado de verdad
const bloque = readFileSync(new URL('seed.sql', raiz), 'utf8').split('\n').filter((l) => l.startsWith('-- ') && /insert into perfiles|select id, split_part|when 'admin'|when 'tecnico'|from auth.users/.test(l)).map((l) => l.slice(3)).join('\n')
await db.exec(bloque)
console.log('perfiles =', (await db.query('select count(*)::int n from perfiles')).rows[0].n)

let fallos = 0
const caso = (nombre, ok, d = '') => { if (!ok) fallos++; console.log(`${ok ? 'OK   ' : 'FALLA'} ${nombre}${d ? ' — ' + d : ''}`) }
async function como(rol, sql, params) {
  await db.exec(`set role ${rol ? 'authenticated' : 'anon'}; select set_config('request.jwt.claim.sub', '${rol ? ids[rol] : ''}', false);`)
  try { return { r: await db.query(sql, params) } } catch (e) { return { e: e.message } } finally { await db.exec('reset role') }
}

const anon = await como(null, 'select id from solicitudes')
caso('Sin sesión no lee solicitudes', anon.r?.rows.length === 0)
const cons = await como('consulta', 'select id from solicitudes limit 1')
caso('consulta puede leer', cons.r?.rows.length === 1)
caso('consulta NO crea clientes', !!(await como('consulta', `insert into clientes(nombre,contacto,tipo) values ('x','y','vecino')`)).e)
caso('tecnico NO crea clientes', !!(await como('tecnico', `insert into clientes(nombre,contacto,tipo) values ('x','y','vecino')`)).e)
const cli = await como('recepcion', `insert into clientes(nombre,contacto,tipo) values ('RLS','r@e.com','vecino') returning id`)
caso('recepcion crea clientes', !!cli.r)
const sol = await como('recepcion', `insert into solicitudes(cliente_id,categoria,equipo,falla) values ($1,'movil','Prueba','Falla de prueba') returning id`, [cli.r?.rows[0].id])
caso('recepcion crea solicitudes', !!sol.r, sol.e)
const id = sol.r?.rows[0].id
const upd = (rol, set) => como(rol, `update solicitudes set ${set} where id = $1 returning id`, [id])
const ok = (x) => !!x.r?.rows.length
caso('tecnico NO salta estados', !!(await upd('tecnico', `estado='listo'`)).e, (await upd('tecnico', `estado='listo'`)).e)
caso('tecnico NO carga cobro', !!(await upd('tecnico', 'cobrado=100')).e)
caso('tecnico NO cancela', !!(await upd('tecnico', `estado='cancelado'`)).e)
caso('tecnico SÍ avanza al siguiente', ok(await upd('tecnico', `estado='en_diagnostico'`)))
caso('admin SÍ carga presupuesto', ok(await upd('admin', 'presupuesto=4000')))
caso('recepcion NO carga presupuesto', !!(await upd('recepcion', 'presupuesto=1')).e)
caso('nadie borra solicitudes', (await como('admin', 'delete from solicitudes where id=$1 returning id', [id])).r?.rows.length === 0)
await como('recepcion', `insert into historial_estados(solicitud_id,estado) values ($1,'recibido')`, [id])
caso('nadie edita historial', (await como('admin', `update historial_estados set nota='x' where solicitud_id=$1 returning id`, [id])).r?.rows.length === 0)
caso('recepcion SÍ cancela', ok(await upd('recepcion', `estado='cancelado'`)))
caso('no se reabre una cancelada', !!(await upd('admin', `estado='en_diagnostico'`)).e)
caso('admin ve 4 perfiles', (await como('admin', 'select id from perfiles')).r?.rows.length === 4)
caso('tecnico ve 1 perfil', (await como('tecnico', 'select id from perfiles')).r?.rows.length === 1)
caso('tecnico NO se cambia el rol', (await como('tecnico', `update perfiles set rol='admin' where id=$1 returning id`, [ids.tecnico])).r?.rows.length === 0)
console.log(fallos ? `\n${fallos} fallaron` : '\nTodos pasaron')
