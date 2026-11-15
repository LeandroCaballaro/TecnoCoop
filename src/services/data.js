import { supabase, supabaseConfigurado } from '../lib/supabase.js'
import { solicitudesIniciales } from '../data/mock.js'
import { sesion } from './auth.js'

// Con Supabase configurado lee y escribe en la base. Sin él usa localStorage:
// los datos quedan en ESTE navegador y no se comparten entre dispositivos.
const KEY = 'tecnocoop.db.v1'

function cargarLocal() {
  try {
    const guardado = JSON.parse(localStorage.getItem(KEY))
    if (guardado?.solicitudes) return guardado
  } catch {
    /* sin almacenamiento: se usa la semilla */
  }
  return { solicitudes: solicitudesIniciales(), historial: [] }
}

function guardarLocal(db) {
  try {
    localStorage.setItem(KEY, JSON.stringify(db))
  } catch {
    throw new Error('No se pudo guardar en el navegador (almacenamiento lleno o bloqueado).')
  }
}

export const reiniciarDatosLocales = () => {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* nada que borrar */
  }
}

export async function listarSolicitudes() {
  if (supabaseConfigurado) {
    const { data, error } = await supabase
      .from('solicitudes')
      .select('id, categoria, equipo, falla, estado, resultado, creada_en, entregada_en, clientes(nombre, tipo)')
      .order('creada_en', { ascending: false })
    if (error) throw new Error(error.message)
    return data.map((s) => ({ ...s, cliente: s.clientes?.nombre, tipo_cliente: s.clientes?.tipo }))
  }
  return [...cargarLocal().solicitudes].sort((a, b) => b.id - a.id)
}

export async function crearSolicitud(f) {
  const hoy = new Date().toISOString().slice(0, 10)
  if (supabaseConfigurado) {
    const { data: cli, error: e1 } = await supabase
      .from('clientes')
      .insert({ nombre: f.cliente.trim(), contacto: f.contacto.trim(), tipo: f.tipo_cliente })
      .select('id')
      .single()
    if (e1) throw new Error(e1.message)
    const { data: sol, error: e2 } = await supabase
      .from('solicitudes')
      .insert({ cliente_id: cli.id, categoria: f.categoria, equipo: f.equipo.trim(), falla: f.falla.trim() })
      .select('id')
      .single()
    if (e2) throw new Error(e2.message)
    await supabase.from('historial_estados').insert({ solicitud_id: sol.id, estado: 'recibido', usuario_id: sesion.usuario?.id })
    return sol.id
  }
  const db = cargarLocal()
  const id = Math.max(0, ...db.solicitudes.map((s) => s.id)) + 1
  db.solicitudes.push({
    id,
    cliente: f.cliente.trim(),
    contacto: f.contacto.trim(),
    tipo_cliente: f.tipo_cliente,
    categoria: f.categoria,
    equipo: f.equipo.trim(),
    falla: f.falla.trim(),
    estado: 'recibido',
    resultado: null,
    creada_en: hoy,
    entregada_en: null,
  })
  db.historial.push({ solicitud_id: id, estado: 'recibido', rol: sesion.rol, fecha: hoy })
  guardarLocal(db)
  return id
}

// Cancelar no borra: cambia el estado y deja la nota en el historial.
export async function cambiarEstado(id, estado, { resultado = null, nota = '' } = {}) {
  const hoy = new Date().toISOString().slice(0, 10)
  const cambios = { estado }
  if (resultado) cambios.resultado = resultado
  if (estado === 'entregado') cambios.entregada_en = hoy
  if (supabaseConfigurado) {
    const { error } = await supabase.from('solicitudes').update(cambios).eq('id', id)
    if (error) throw new Error(error.message)
    await supabase.from('historial_estados').insert({ solicitud_id: id, estado, nota, usuario_id: sesion.usuario?.id })
    return
  }
  const db = cargarLocal()
  const s = db.solicitudes.find((x) => x.id === id)
  if (!s) throw new Error('La solicitud ya no existe.')
  Object.assign(s, cambios)
  db.historial.push({ solicitud_id: id, estado, nota, rol: sesion.rol, fecha: hoy })
  guardarLocal(db)
}
