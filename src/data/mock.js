// DATOS DE PRUEBA (ficticios). Se reemplazan por Supabase en la etapa de conexion.
export const ESTADOS = ['recibido', 'en_diagnostico', 'presupuestado', 'en_reparacion', 'listo', 'entregado', 'cancelado']

export const solicitudes = [
  { id: 1, cliente: 'Ana Pérez (ficticia)', equipo: 'Celular', falla: 'Pantalla rota', estado: 'recibido', fecha: '2026-11-02' },
  { id: 2, cliente: 'Escuela - Aula 3', equipo: 'PC de escritorio', falla: 'No enciende (fuente)', estado: 'en_reparacion', fecha: '2026-11-03' },
  { id: 3, cliente: 'Luis Gómez (ficticio)', equipo: 'Pava eléctrica', falla: 'No calienta', estado: 'entregado', fecha: '2026-11-04' },
]
