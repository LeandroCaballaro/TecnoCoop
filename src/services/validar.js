import { CATEGORIAS, TIPOS_CLIENTE } from '../constants.js'

const CONTACTO = /^([^\s@]+@[^\s@]+\.[^\s@]+|\+?[0-9 ()-]{8,18})$/

// Devuelve { campo: mensaje } con los errores; objeto vacío = válido.
export function validarSolicitud(f) {
  const e = {}
  if ((f.cliente || '').trim().length < 3) e.cliente = 'Ingresá el nombre (mínimo 3 letras).'
  if (!CONTACTO.test((f.contacto || '').trim())) e.contacto = 'Ingresá un correo válido o un teléfono de 8 a 15 dígitos.'
  if (!TIPOS_CLIENTE[f.tipo_cliente]) e.tipo_cliente = 'Elegí el tipo de cliente.'
  if (!CATEGORIAS[f.categoria]) e.categoria = 'Elegí la categoría del equipo.'
  if ((f.equipo || '').trim().length < 3) e.equipo = 'Indicá el equipo (ej: Celular).'
  if ((f.falla || '').trim().length < 10) e.falla = 'Describí la falla con al menos 10 caracteres.'
  return e
}

export const validarMotivo = (m) => ((m || '').trim().length >= 5 ? '' : 'El motivo es obligatorio (mínimo 5 caracteres).')
