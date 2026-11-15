// P12: comprueba que la BASE rechaza lo que cada rol no puede hacer (no solo la interfaz).
// Requiere db/schema.sql + db/seed.sql ejecutados y 4 usuarios creados. Se corre con:
//   SUPABASE_URL=... SUPABASE_ANON_KEY=... TEST_PASSWORD=... node tests/rls.e2e.mjs
// TEST_PASSWORD es la contraseña de los 4 usuarios de prueba; viene del entorno, nunca del repositorio.
// Deja registros de prueba (clientes «RLS prueba»): el historial es de solo agregado a propósito.
import { createClient } from '@supabase/supabase-js'

const { SUPABASE_URL: url, SUPABASE_ANON_KEY: key, TEST_PASSWORD: password } = process.env
if (!url || !key || !password) {
  console.error('Faltan SUPABASE_URL, SUPABASE_ANON_KEY o TEST_PASSWORD.')
  process.exit(2)
}
const dominio = process.env.TEST_DOMAIN || 'tecnocoop.test'

async function como(rol) {
  const c = createClient(url, key, { auth: { persistSession: false } })
  const { error } = await c.auth.signInWithPassword({ email: `${rol}@${dominio}`, password })
  if (error) throw new Error(`No se pudo ingresar como ${rol}: ${error.message}`)
  return c
}

let fallos = 0
const caso = (nombre, ok, detalle = '') => {
  if (!ok) fallos++
  console.log(`${ok ? 'OK   ' : 'FALLA'} ${nombre}${detalle ? ' — ' + detalle : ''}`)
}
const nueva = (c) =>
  c.from('clientes').insert({ nombre: 'RLS prueba', contacto: 'rls@example.com', tipo: 'vecino' }).select('id').single()

const anon = createClient(url, key, { auth: { persistSession: false } })
const r0 = await anon.from('solicitudes').select('id')
caso('Sin sesión no lee solicitudes', !r0.error && r0.data.length === 0)

const consulta = await como('consulta')
const rc = await consulta.from('solicitudes').select('id').limit(1)
caso('consulta puede leer', !rc.error && rc.data.length === 1)
const ci = await nueva(consulta)
caso('consulta NO puede crear clientes', Boolean(ci.error), ci.error?.message)

const tecnico = await como('tecnico')
const ti = await nueva(tecnico)
caso('tecnico NO puede crear clientes', Boolean(ti.error), ti.error?.message)

const recepcion = await como('recepcion')
const cli = await nueva(recepcion)
caso('recepcion puede crear clientes', !cli.error, cli.error?.message)
const sol = await recepcion
  .from('solicitudes')
  .insert({ cliente_id: cli.data?.id, categoria: 'movil', equipo: 'Prueba RLS', falla: 'Prueba automática de permisos' })
  .select('id')
  .single()
caso('recepcion puede crear solicitudes', !sol.error, sol.error?.message)
const id = sol.data?.id

const salto = await tecnico.from('solicitudes').update({ estado: 'listo' }).eq('id', id)
caso('tecnico NO puede saltarse estados (recibido -> listo)', Boolean(salto.error), salto.error?.message)
const cobro = await tecnico.from('solicitudes').update({ cobrado: 100 }).eq('id', id)
caso('tecnico NO puede cargar el cobro', Boolean(cobro.error), cobro.error?.message)
const cancTec = await tecnico.from('solicitudes').update({ estado: 'cancelado' }).eq('id', id)
caso('tecnico NO puede cancelar', Boolean(cancTec.error), cancTec.error?.message)
const avance = await tecnico.from('solicitudes').update({ estado: 'en_diagnostico' }).eq('id', id)
caso('tecnico SÍ puede avanzar al estado siguiente', !avance.error, avance.error?.message)

const delSol = await recepcion.from('solicitudes').delete().eq('id', id).select()
caso('Nadie puede borrar solicitudes', Boolean(delSol.error) || delSol.data.length === 0)
const edHist = await recepcion.from('historial_estados').update({ nota: 'x' }).eq('solicitud_id', id).select()
caso('Nadie puede editar el historial', Boolean(edHist.error) || edHist.data.length === 0)

const cancRec = await recepcion.from('solicitudes').update({ estado: 'cancelado' }).eq('id', id)
caso('recepcion SÍ puede cancelar', !cancRec.error, cancRec.error?.message)

const admin = await como('admin')
const perf = await admin.from('perfiles').select('id')
caso('admin ve todos los perfiles', !perf.error && perf.data.length >= 4)
const perfT = await tecnico.from('perfiles').select('id')
caso('tecnico ve solo su perfil', !perfT.error && perfT.data.length === 1)

console.log(fallos ? `\n${fallos} caso(s) fallaron.` : '\nTodos los casos pasaron.')
process.exit(fallos ? 1 : 0)
