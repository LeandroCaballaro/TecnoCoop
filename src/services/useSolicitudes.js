import { ref } from 'vue'
import { listarSolicitudes } from './data.js'

// Estados de carga compartidos por solicitudes, tablero e informe.
export function useSolicitudes() {
  const solicitudes = ref([])
  const estado = ref('cargando') // cargando | listo | error
  const error = ref('')
  const actualizado = ref(null)

  // silencioso === true: refresca la lista sin mostrar «Cargando…» (la tabla no parpadea ni salta).
  async function cargar(silencioso = false) {
    const quieto = silencioso === true && estado.value === 'listo'
    if (!quieto) estado.value = 'cargando'
    try {
      solicitudes.value = await listarSolicitudes()
      actualizado.value = new Date()
      estado.value = 'listo'
    } catch (e) {
      error.value = e.message
      if (!quieto) estado.value = 'error'
    }
  }
  return { solicitudes, estado, error, actualizado, cargar }
}

export const horaLegible = (d) => (d ? d.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }) : 'nunca')
