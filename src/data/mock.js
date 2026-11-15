// DATOS DE PRUEBA (ficticios). Las fechas son relativas a hoy para que siempre haya datos.
// Fila: cliente, tipo, categoría, equipo, falla, estado, resultado, días atrás de ingreso, días hasta entrega.
const filas = [
  ['Ana Pérez', 'alumno', 'movil', 'Celular', 'Pantalla rota', 'entregado', 'reparado', 41, 4],
  ['Escuela - Aula 3', 'escuela', 'informatica', 'PC de escritorio', 'Fuente quemada', 'entregado', 'reparado', 40, 6],
  ['Luis Gómez', 'vecino', 'electrodomestico', 'Pava eléctrica', 'No calienta', 'entregado', 'reparado', 38, 2],
  ['Marta Díaz', 'docente', 'informatica', 'Notebook', 'Lenta y con virus', 'entregado', 'reparado', 33, 3],
  ['Kiosco Sol', 'comercio', 'electrodomestico', 'Licuadora', 'El motor no gira', 'entregado', 'no_reparable', 32, 6],
  ['Pablo Ruiz', 'alumno', 'movil', 'Tablet', 'Batería hinchada', 'entregado', 'reparado', 31, 7],
  ['Escuela - Biblioteca', 'escuela', 'informatica', 'PC de escritorio', 'No arranca el sistema', 'entregado', 'reparado', 27, 4],
  ['Rosa Medina', 'vecino', 'electrodomestico', 'Ventilador', 'Hélice trabada', 'entregado', 'reparado', 26, 1],
  ['Sofía Luna', 'alumno', 'movil', 'Celular', 'No carga', 'entregado', 'reparado', 24, 7],
  ['Carlos Vega', 'vecino', 'informatica', 'Notebook', 'Disco dañado', 'entregado', 'no_reparable', 20, 9],
  ['Panadería Norte', 'comercio', 'electrodomestico', 'Tostadora', 'Resistencia cortada', 'entregado', 'reparado', 19, 3],
  ['Julia Paz', 'docente', 'movil', 'Celular', 'Pantalla rota', 'entregado', 'reparado', 17, 5],
  ['Escuela - Aula 5', 'escuela', 'informatica', 'Notebook', 'Falla de memoria RAM', 'entregado', 'reparado', 13, 4],
  ['Escuela - Sala Docentes', 'escuela', 'informatica', 'PC de escritorio', 'Sin conexión a internet', 'entregado', 'reparado', 6, 2],
  ['Diego Fava', 'alumno', 'electrodomestico', 'Plancha', 'Termostato roto', 'listo', 'reparado', 12, null],
  ['Elena Ríos', 'vecino', 'movil', 'Celular', 'Mojado, no enciende', 'en_reparacion', null, 11, null],
  ['Tomás Alba', 'alumno', 'informatica', 'PC de escritorio', 'Recalienta, cambio de pasta', 'en_reparacion', null, 9, null],
  ['Gimnasio Fénix', 'comercio', 'informatica', 'PC de escritorio', 'No enciende', 'presupuestado', null, 8, null],
  ['Nora Silva', 'docente', 'electrodomestico', 'Secador de pelo', 'Cable dañado', 'en_diagnostico', null, 5, null],
  ['Ana Pérez', 'alumno', 'movil', 'Tablet', 'Pantalla rota', 'recibido', null, 3, null],
  ['Luis Gómez', 'vecino', 'informatica', 'Notebook', 'El teclado no responde', 'recibido', null, 2, null],
  ['Mario Cruz', 'vecino', 'electrodomestico', 'Pava eléctrica', 'Pierde agua', 'cancelado', null, 10, null],
]

const aISO = (diasAtras) => {
  const d = new Date()
  d.setDate(d.getDate() - diasAtras)
  return d.toISOString().slice(0, 10)
}

export const solicitudesIniciales = () =>
  filas.map(([cliente, tipo_cliente, categoria, equipo, falla, estado, resultado, atras, hasta], i) => ({
    id: i + 1,
    cliente,
    contacto: 'contacto-ficticio@example.com',
    tipo_cliente,
    categoria,
    equipo,
    falla,
    estado,
    resultado,
    creada_en: aISO(atras),
    entregada_en: hasta === null ? null : aISO(atras - hasta),
  }))
