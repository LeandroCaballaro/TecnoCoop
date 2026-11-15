import { ESTADOS, ESTADO_ETIQUETA, ESTADO_COLOR, CATEGORIAS } from '../constants.js'

export const dia = (iso) => String(iso).slice(0, 10)
const diasEntre = (a, b) => (Date.parse(dia(b)) - Date.parse(dia(a))) / 86400000
const redondear = (n) => Math.round(n * 10) / 10

// Filtra por fecha de ingreso (AAAA-MM-DD, inclusive) y categoría.
export function filtrar(sols, { desde = '', hasta = '', categoria = '' } = {}) {
  return sols.filter(
    (s) =>
      (!desde || dia(s.creada_en) >= desde) &&
      (!hasta || dia(s.creada_en) <= hasta) &&
      (!categoria || s.categoria === categoria),
  )
}

// valor === null significa "no calculable": la vista muestra el motivo, nunca un 0.
export function calcularKpis(sols, metas) {
  const entregadas = sols.filter((s) => s.estado === 'entregado')
  const reparados = entregadas.filter((s) => s.resultado === 'reparado').length
  const sinSolicitudes = 'No hay solicitudes en el período elegido.'
  const sinEntregas = 'Todavía no hay equipos entregados en el período: no se puede calcular.'
  const dias = entregadas.map((s) => diasEntre(s.creada_en, s.entregada_en))

  const kpis = [
    {
      id: 'reparados',
      nombre: 'Equipos reparados y entregados',
      unidad: 'equipos',
      valor: sols.length ? reparados : null,
      meta: metas.reparados,
      mejor: 'mayor',
      motivo: sinSolicitudes,
    },
    {
      id: 'exito',
      nombre: 'Reparaciones exitosas',
      unidad: '% de entregados',
      valor: entregadas.length ? Math.round((reparados / entregadas.length) * 100) : null,
      meta: metas.exito,
      mejor: 'mayor',
      motivo: sinEntregas,
      detalle: `${reparados} de ${entregadas.length} entregados`,
    },
    {
      id: 'dias',
      nombre: 'Tiempo medio hasta la entrega',
      unidad: 'días',
      valor: entregadas.length ? redondear(dias.reduce((a, b) => a + b, 0) / dias.length) : null,
      meta: metas.dias,
      mejor: 'menor',
      motivo: sinEntregas,
    },
  ]
  return kpis.map((k) => ({
    ...k,
    cumple: k.valor === null ? null : k.mejor === 'mayor' ? k.valor >= k.meta : k.valor <= k.meta,
  }))
}

export const porEstado = (sols) =>
  ESTADOS.map((e) => ({
    etiqueta: ESTADO_ETIQUETA[e],
    valor: sols.filter((s) => s.estado === e).length,
    color: ESTADO_COLOR[e],
  }))

export const porCategoria = (sols) =>
  Object.entries(CATEGORIAS).map(([k, nombre]) => ({
    etiqueta: nombre,
    valor: sols.filter((s) => s.categoria === k).length,
    color: '#1d4ed8',
  }))

function lunesDe(iso) {
  const d = new Date(`${dia(iso)}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7))
  return d.toISOString().slice(0, 10)
}

export function porSemana(sols) {
  const cuenta = {}
  sols.forEach((s) => {
    const l = lunesDe(s.creada_en)
    cuenta[l] = (cuenta[l] || 0) + 1
  })
  return Object.keys(cuenta)
    .sort()
    .map((l) => ({ etiqueta: `${l.slice(8)}/${l.slice(5, 7)}`, valor: cuenta[l], color: '#1d4ed8' }))
}
