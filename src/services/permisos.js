// Misma matriz que las políticas RLS de db/schema.sql: la interfaz solo la refleja.
const MATRIZ = {
  admin: ['solicitud.crear', 'solicitud.avanzar', 'solicitud.cancelar', 'tablero.ver', 'informe.ver'],
  recepcion: ['solicitud.crear', 'solicitud.avanzar', 'solicitud.cancelar', 'tablero.ver'],
  tecnico: ['solicitud.avanzar', 'tablero.ver'],
  consulta: ['tablero.ver', 'informe.ver'],
}

export const puede = (rol, accion) => Boolean(MATRIZ[rol]?.includes(accion))
