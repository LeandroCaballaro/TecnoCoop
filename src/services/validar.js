import { CATEGORIAS, TIPOS_CLIENTE } from '../constants.js'

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TELEFONO = /^\+?[0-9 ()-]+$/
export const MAX = { cliente: 100, contacto: 100, equipo: 100, falla: 1000, motivo: 500, interpretacion: 5000 }

// Teléfono: solo + espacios ( ) - y entre 8 y 15 dígitos reales.
const contactoValido = (c) =>
  c.length <= MAX.contacto && (CORREO.test(c) || (TELEFONO.test(c) && /^\d{8,15}$/.test(c.replace(/\D/g, ''))))

// Devuelve { campo: mensaje } con los errores; objeto vacío = válido.
export function validarSolicitud(f) {
  const e = {}
  const n = (c) => (f[c] || '').trim().length
  if (n('cliente') < 3 || n('cliente') > MAX.cliente) e.cliente = `Ingresá el nombre (de 3 a ${MAX.cliente} caracteres).`
  if (!contactoValido((f.contacto || '').trim())) e.contacto = 'Ingresá un correo válido o un teléfono de 8 a 15 dígitos.'
  if (!TIPOS_CLIENTE[f.tipo_cliente]) e.tipo_cliente = 'Elegí el tipo de cliente.'
  if (!CATEGORIAS[f.categoria]) e.categoria = 'Elegí la categoría del equipo.'
  if (n('equipo') < 3 || n('equipo') > MAX.equipo) e.equipo = `Indicá el equipo (de 3 a ${MAX.equipo} caracteres, ej: Celular).`
  if (n('falla') < 10 || n('falla') > MAX.falla) e.falla = `Describí la falla (de 10 a ${MAX.falla} caracteres).`
  return e
}

export const validarMotivo = (m) => {
  const n = (m || '').trim().length
  return n >= 5 && n <= MAX.motivo ? '' : `El motivo es obligatorio (de 5 a ${MAX.motivo} caracteres).`
}
