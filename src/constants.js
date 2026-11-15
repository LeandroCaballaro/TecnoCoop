export const ESTADOS = ['recibido', 'en_diagnostico', 'presupuestado', 'en_reparacion', 'listo', 'entregado', 'cancelado']

export const ESTADO_ETIQUETA = {
  recibido: 'Recibido',
  en_diagnostico: 'En diagnóstico',
  presupuestado: 'Presupuestado',
  en_reparacion: 'En reparación',
  listo: 'Listo para retirar',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}

// Un color por estado, el mismo en todos los gráficos y etiquetas.
export const ESTADO_COLOR = {
  recibido: '#6b7280',
  en_diagnostico: '#b45309',
  presupuestado: '#7c3aed',
  en_reparacion: '#1d4ed8',
  listo: '#0f766e',
  entregado: '#15803d',
  cancelado: '#b91c1c',
}

// Siguiente estado permitido. Cancelar se permite desde cualquier estado no final.
export const SIGUIENTE = {
  recibido: 'en_diagnostico',
  en_diagnostico: 'presupuestado',
  presupuestado: 'en_reparacion',
  en_reparacion: 'listo',
  listo: 'entregado',
}

export const CATEGORIAS = {
  movil: 'Celulares y tablets',
  informatica: 'Computadoras y notebooks',
  electrodomestico: 'Electrodomésticos',
}

export const TIPOS_CLIENTE = {
  alumno: 'Alumno/a',
  docente: 'Docente',
  escuela: 'Escuela',
  vecino: 'Vecino/a',
  comercio: 'Comercio',
}

export const ROLES = {
  admin: 'Administración (Presidencia / Tesorería)',
  recepcion: 'Recepción (Secretaría / Logística)',
  tecnico: 'Técnico/a de reparación',
  consulta: 'Consulta (Sindicatura)',
}

// Metas FICTICIAS de la prueba piloto: se ajustan con el reglamento real.
export const METAS = { reparados: 10, exito: 80, dias: 7 }
