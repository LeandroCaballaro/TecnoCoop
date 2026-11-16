<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { sesion } from '../services/auth.js'
import { puede } from '../services/permisos.js'
import { crearSolicitud, cambiarEstado } from '../services/data.js'
import { useSolicitudes } from '../services/useSolicitudes.js'
import { validarSolicitud, validarMotivo, MAX } from '../services/validar.js'
import { ESTADOS, ESTADO_ETIQUETA, ESTADO_COLOR, SIGUIENTE, CATEGORIAS, TIPOS_CLIENTE } from '../constants.js'

const { solicitudes, estado: carga, error: errorCarga, cargar } = useSolicitudes()
onMounted(cargar)

const vacio = () => ({ cliente: '', contacto: '', tipo_cliente: '', categoria: '', equipo: '', falla: '' })
const form = reactive(vacio())
const errores = ref({})
const guardando = ref(false)
const mensaje = ref({ tipo: '', texto: '' })
const aviso = (tipo, texto) => (mensaje.value = { tipo, texto })

const busqueda = ref('')
const filtroEstado = ref('')
const lista = computed(() => {
  const q = busqueda.value.trim().replace(/^#/, '').toLowerCase()
  return solicitudes.value.filter(
    (s) =>
      (!filtroEstado.value || s.estado === filtroEstado.value) &&
      (!q || [s.cliente, s.equipo, s.falla, String(s.id)].some((t) => (t || '').toLowerCase().includes(q))),
  )
})

async function registrar() {
  errores.value = validarSolicitud(form)
  if (Object.keys(errores.value).length) return aviso('error', 'Revisá los campos marcados.')
  guardando.value = true
  try {
    const id = await crearSolicitud(form)
    Object.assign(form, vacio())
    aviso('ok', `Solicitud #${id} registrada en estado «Recibido».`)
    await cargar()
  } catch (e) {
    aviso('error', `No se pudo registrar: ${e.message}`)
  } finally {
    guardando.value = false
  }
}

const resultado = reactive({}) // resultado elegido por solicitud antes de pasar a «Listo»
async function avanzar(s) {
  try {
    const sig = SIGUIENTE[s.estado]
    await cambiarEstado(s.id, sig, sig === 'listo' ? { resultado: resultado[s.id] || 'reparado' } : {})
    aviso('ok', `Solicitud #${s.id}: ${ESTADO_ETIQUETA[sig]}.`)
    await cargar()
  } catch (e) {
    aviso('error', `No se pudo cambiar el estado: ${e.message}`)
  }
}

const cancelando = ref(null)
const motivo = ref('')
const errorMotivo = ref('')
function pedirCancelar(id) {
  cancelando.value = id
  motivo.value = ''
  errorMotivo.value = ''
}
async function confirmarCancelar() {
  errorMotivo.value = validarMotivo(motivo.value)
  if (errorMotivo.value) return
  try {
    await cambiarEstado(cancelando.value, 'cancelado', { nota: motivo.value.trim() })
    aviso('ok', `Solicitud #${cancelando.value} cancelada. El historial se conserva.`)
    cancelando.value = null
    await cargar()
  } catch (e) {
    aviso('error', `No se pudo cancelar: ${e.message}`)
  }
}

const abierta = (s) => SIGUIENTE[s.estado] !== undefined
</script>

<template>
  <p v-if="mensaje.texto" :class="mensaje.tipo === 'ok' ? 'ok' : 'aviso'" role="status">{{ mensaje.texto }}</p>

  <section v-if="puede(sesion.rol, 'solicitud.crear')" class="tarjeta no-imprimir">
    <h2>Nueva solicitud</h2>
    <form novalidate @submit.prevent="registrar">
      <div class="grilla">
        <label>Cliente <input v-model="form.cliente" :maxlength="MAX.cliente" /><span v-if="errores.cliente" class="error">{{ errores.cliente }}</span></label>
        <label>Contacto (correo o teléfono) <input v-model="form.contacto" :maxlength="MAX.contacto" /><span v-if="errores.contacto" class="error">{{ errores.contacto }}</span></label>
        <label>
          Tipo de cliente
          <select v-model="form.tipo_cliente"><option value="">Elegir…</option><option v-for="(n, k) in TIPOS_CLIENTE" :key="k" :value="k">{{ n }}</option></select>
          <span v-if="errores.tipo_cliente" class="error">{{ errores.tipo_cliente }}</span>
        </label>
        <label>
          Categoría
          <select v-model="form.categoria"><option value="">Elegir…</option><option v-for="(n, k) in CATEGORIAS" :key="k" :value="k">{{ n }}</option></select>
          <span v-if="errores.categoria" class="error">{{ errores.categoria }}</span>
        </label>
        <label>Equipo <input v-model="form.equipo" :maxlength="MAX.equipo" /><span v-if="errores.equipo" class="error">{{ errores.equipo }}</span></label>
      </div>
      <label>Falla (10 a 1000 caracteres) <textarea v-model="form.falla" rows="2" :maxlength="MAX.falla" /><span v-if="errores.falla" class="error">{{ errores.falla }}</span></label>
      <button class="primario" :disabled="guardando">{{ guardando ? 'Guardando…' : 'Registrar equipo' }}</button>
    </form>
  </section>

  <section class="tarjeta">
    <h2>Solicitudes</h2>
    <div class="filtros no-imprimir">
      <input v-model="busqueda" type="search" placeholder="Buscar por cliente, equipo, falla o número" aria-label="Buscar" />
      <select v-model="filtroEstado" aria-label="Filtrar por estado">
        <option value="">Todos los estados</option>
        <option v-for="e in ESTADOS" :key="e" :value="e">{{ ESTADO_ETIQUETA[e] }}</option>
      </select>
      <button @click="cargar">Actualizar</button>
    </div>

    <p v-if="carga === 'cargando'" class="cargando">Cargando…</p>
    <p v-else-if="carga === 'error'" class="error" role="alert">No se pudo cargar: {{ errorCarga }} <button @click="cargar">Reintentar</button></p>
    <p v-else-if="!lista.length" class="vacio">No hay solicitudes con esos filtros.</p>
    <table v-else class="tabla">
      <thead><tr><th>N.º</th><th>Cliente</th><th>Equipo y falla</th><th>Estado</th><th>Acciones</th></tr></thead>
      <tbody>
        <tr v-for="s in lista" :key="s.id">
          <td data-et="N.º">#{{ s.id }}</td>
          <td data-et="Cliente">{{ s.cliente }}</td>
          <td data-et="Equipo">{{ s.equipo }} — {{ s.falla }}</td>
          <td data-et="Estado"><span class="insignia" :style="{ background: ESTADO_COLOR[s.estado] }">{{ ESTADO_ETIQUETA[s.estado] }}</span></td>
          <td>
            <div v-if="abierta(s)" class="acciones">
              <select v-if="s.estado === 'en_reparacion' && puede(sesion.rol, 'solicitud.avanzar')" v-model="resultado[s.id]" aria-label="Resultado">
                <option value="reparado">Reparado</option><option value="no_reparable">No reparable</option>
              </select>
              <button v-if="puede(sesion.rol, 'solicitud.avanzar')" @click="avanzar(s)">Pasar a «{{ ESTADO_ETIQUETA[SIGUIENTE[s.estado]] }}»</button>
              <button v-if="puede(sesion.rol, 'solicitud.cancelar')" class="peligro" @click="pedirCancelar(s.id)">Cancelar</button>
            </div>
            <div v-if="cancelando === s.id">
              <label>Motivo de la cancelación <textarea v-model="motivo" rows="2" :maxlength="MAX.motivo" /></label>
              <p v-if="errorMotivo" class="error">{{ errorMotivo }}</p>
              <div class="acciones"><button class="peligro" @click="confirmarCancelar">Confirmar cancelación</button><button @click="cancelando = null">Volver</button></div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
