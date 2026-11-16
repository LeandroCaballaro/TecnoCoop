import { test } from 'node:test'
import assert from 'node:assert/strict'
import { filtrar, calcularKpis, porEstado, porSemana } from '../src/services/metrics.js'
import { validarSolicitud, validarMotivo } from '../src/services/validar.js'
import { puede } from '../src/services/permisos.js'
import { METAS } from '../src/constants.js'

const s = (o) => ({ categoria: 'movil', estado: 'recibido', resultado: null, creada_en: '2026-11-02', entregada_en: null, ...o })

test('KPI sin solicitudes: no calculable, nunca 0', () => {
  const k = calcularKpis([], METAS)
  assert.ok(k.every((x) => x.valor === null && x.cumple === null))
})

test('KPI sin entregas: éxito y tiempo no calculables', () => {
  const k = calcularKpis([s({})], METAS)
  assert.equal(k.find((x) => x.id === 'exito').valor, null)
  assert.equal(k.find((x) => x.id === 'dias').valor, null)
  assert.equal(k.find((x) => x.id === 'reparados').valor, 0)
})

test('KPI con entregas: reparados, éxito y días', () => {
  const sols = [
    s({ estado: 'entregado', resultado: 'reparado', entregada_en: '2026-11-04' }),
    s({ estado: 'entregado', resultado: 'no_reparable', entregada_en: '2026-11-08' }),
  ]
  const k = Object.fromEntries(calcularKpis(sols, METAS).map((x) => [x.id, x]))
  assert.equal(k.reparados.valor, 1)
  assert.equal(k.exito.valor, 50)
  assert.equal(k.exito.cumple, false)
  assert.equal(k.dias.valor, 4) // (2 + 6) / 2
  assert.equal(k.dias.cumple, true)
})

test('filtrar por período inclusive y categoría', () => {
  const sols = [s({ creada_en: '2026-11-01' }), s({ creada_en: '2026-11-10', categoria: 'informatica' })]
  assert.equal(filtrar(sols, { desde: '2026-11-02' }).length, 1)
  assert.equal(filtrar(sols, { hasta: '2026-11-01' }).length, 1)
  assert.equal(filtrar(sols, { categoria: 'informatica' }).length, 1)
})

test('porEstado incluye todos los estados, también con cero', () => {
  const r = porEstado([s({})])
  assert.equal(r.length, 7)
  assert.equal(r.reduce((a, i) => a + i.valor, 0), 1)
})

test('porSemana agrupa por lunes', () => {
  // 2026-11-02 es lunes; 2026-11-08 es domingo de esa misma semana
  const r = porSemana([s({ creada_en: '2026-11-02' }), s({ creada_en: '2026-11-08' }), s({ creada_en: '2026-11-09' })])
  assert.deepEqual(r.map((x) => [x.etiqueta, x.valor]), [['02/11', 2], ['09/11', 1]])
})

test('validarSolicitud: vacío falla, válido pasa', () => {
  assert.equal(Object.keys(validarSolicitud({})).length, 6)
  const ok = { cliente: 'Ana', contacto: 'ana@example.com', tipo_cliente: 'vecino', categoria: 'movil', equipo: 'Celular', falla: 'Pantalla rota' }
  assert.deepEqual(validarSolicitud(ok), {})
  assert.ok(validarSolicitud({ ...ok, contacto: 'abc' }).contacto)
  assert.ok(validarSolicitud({ ...ok, contacto: '11 5555-1234' }).contacto === undefined)
  assert.ok(validarSolicitud({ ...ok, falla: 'rota' }).falla)
})

test('validarMotivo exige 5 caracteres', () => {
  assert.ok(validarMotivo('  ab '))
  assert.equal(validarMotivo('desistió'), '')
})

test('permisos por rol', () => {
  assert.equal(puede('consulta', 'solicitud.crear'), false)
  assert.equal(puede('consulta', 'informe.ver'), true)
  assert.equal(puede('tecnico', 'informe.ver'), false)
  assert.equal(puede('tecnico', 'solicitud.cancelar'), false)
  assert.equal(puede('recepcion', 'solicitud.crear'), true)
  assert.equal(puede('inexistente', 'tablero.ver'), false)
})

test('contacto: teléfono exige 8 a 15 dígitos reales; correo válido', () => {
  const ok = { cliente: 'Ana', tipo_cliente: 'alumno', categoria: 'movil', equipo: 'Cel', falla: 'No enciende nunca' }
  const malo = (c) => 'contacto' in validarSolicitud({ ...ok, contacto: c })
  for (const c of ['--------', '((((((((', '        ', '+12345678901234567', '1234567', 'a@b']) assert.ok(malo(c), c)
  for (const c of ['+54 11 1234-5678', '(011) 4444 5555', 'a@b.co']) assert.ok(!malo(c), c)
})

test('límites de largo en alta y motivo', () => {
  const f = { cliente: 'Ana', contacto: 'a@b.co', tipo_cliente: 'alumno', categoria: 'movil', equipo: 'Cel', falla: 'x'.repeat(1001) }
  assert.ok('falla' in validarSolicitud(f))
  assert.ok(validarMotivo('m'.repeat(501)))
})

test('fechas corruptas no rompen métricas ni el promedio de días', () => {
  const sols = [
    s({ estado: 'entregado', resultado: 'reparado', creada_en: 'basura', entregada_en: 'x' }),
    s({ estado: 'entregado', resultado: 'reparado', creada_en: '2026-11-10', entregada_en: '2026-11-01' }),
    s({ estado: 'entregado', resultado: 'reparado', entregada_en: '2026-11-04' }),
  ]
  assert.equal(calcularKpis(sols, METAS).find((x) => x.id === 'dias').valor, 2)
  assert.equal(porSemana(sols).length, 2) // la fecha corrupta se omite
})
