<script setup>
import { ref, computed, onMounted } from 'vue'
import BarChart from '../components/BarChart.vue'
import { useSolicitudes, horaLegible } from '../services/useSolicitudes.js'
import { filtrar, calcularKpis, porEstado, porCategoria, porSemana } from '../services/metrics.js'
import { CATEGORIAS, METAS } from '../constants.js'

const { solicitudes, estado, error, actualizado, cargar } = useSolicitudes()
onMounted(cargar) // se actualiza al ingresar y con el botón; no hay tiempo real

const periodo = ref('30')
const categoria = ref('')
const rango = computed(() => {
  if (periodo.value === 'todo') return {}
  const d = new Date()
  d.setDate(d.getDate() - Number(periodo.value))
  return { desde: d.toISOString().slice(0, 10) }
})
const textoPeriodo = computed(() => (periodo.value === 'todo' ? 'todo el historial' : `últimos ${periodo.value} días`))

// Una sola lista filtrada alimenta indicadores y gráficos: el filtro los afecta a todos.
const filtradas = computed(() => filtrar(solicitudes.value, { ...rango.value, categoria: categoria.value }))
const kpis = computed(() => calcularKpis(filtradas.value, METAS))
const sub = computed(() => `${textoPeriodo.value} · cantidad de solicitudes`)
const fmt = (k) => (k.unidad === 'días' ? String(k.valor).replace('.', ',') : k.valor)
</script>

<template>
  <h2>Tablero</h2>
  <div class="filtros no-imprimir">
    <label>Período
      <select v-model="periodo"><option value="7">Últimos 7 días</option><option value="30">Últimos 30 días</option><option value="todo">Todo el historial</option></select>
    </label>
    <label>Categoría
      <select v-model="categoria"><option value="">Todas</option><option v-for="(n, k) in CATEGORIAS" :key="k" :value="k">{{ n }}</option></select>
    </label>
    <button @click="cargar" :disabled="estado === 'cargando'">Actualizar</button>
  </div>
  <p class="nocalc">Actualizado: {{ horaLegible(actualizado) }} · se renueva al ingresar y con el botón «Actualizar» (sin tiempo real).</p>

  <p v-if="estado === 'cargando'" class="cargando">Cargando…</p>
  <p v-else-if="estado === 'error'" class="error" role="alert">No se pudo cargar el tablero: {{ error }} <button @click="cargar">Reintentar</button></p>
  <p v-else-if="!filtradas.length" class="vacio">No hay solicitudes en este período y categoría. Probá con «Todo el historial».</p>
  <template v-else>
    <section class="kpis">
      <article v-for="k in kpis" :key="k.id" class="kpi">
        <div class="nombre">{{ k.nombre }}</div>
        <div v-if="k.valor !== null" class="numero">{{ fmt(k) }} <small>{{ k.valor === 1 ? k.unidad.replace('equipos', 'equipo').replace('días', 'día') : k.unidad }}</small></div>
        <div v-else class="nocalc"><strong>No calculable.</strong> {{ k.motivo }}</div>
        <div class="meta">
          Meta: {{ k.mejor === 'mayor' ? '≥' : '≤' }} {{ k.meta }} {{ k.unidad }} ·
          <strong :class="k.cumple === null ? 'nocalc' : k.cumple ? 'cumple' : 'nocumple'">{{ k.cumple === null ? 'Sin dato' : k.cumple ? 'Cumplida' : 'No cumplida' }}</strong>
        </div>
        <div v-if="k.detalle && k.valor !== null" class="meta nocalc">{{ k.detalle }}</div>
      </article>
    </section>
    <p class="nocalc">Metas ficticias de la prueba piloto.</p>
    <section class="graficos">
      <BarChart titulo="Solicitudes por estado" :subtitulo="sub" :items="porEstado(filtradas)" mostrar-porcentaje />
      <BarChart titulo="Solicitudes por categoría" :subtitulo="sub" :items="porCategoria(filtradas)" mostrar-porcentaje />
      <BarChart titulo="Ingresos por semana" :subtitulo="`${textoPeriodo} · semana que empieza el lunes (dd/mm)`" :items="porSemana(filtradas)" vertical />
    </section>
  </template>
</template>
