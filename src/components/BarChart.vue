<script setup>
import { computed } from 'vue'

// Gráfico de barras reutilizable (tablero e informe). Cada barra lleva su etiqueta y su valor.
const props = defineProps({
  titulo: { type: String, required: true },
  subtitulo: { type: String, default: '' }, // período y unidad
  items: { type: Array, required: true }, // [{ etiqueta, valor, color }]
  vertical: Boolean,
  mostrarPorcentaje: Boolean, // en porcentajes se informa el total
})

const total = computed(() => props.items.reduce((a, i) => a + i.valor, 0))
const max = computed(() => Math.max(1, ...props.items.map((i) => i.valor)))
const pct = (v) => (total.value ? Math.round((v / total.value) * 100) : 0)
const texto = (i) => (props.mostrarPorcentaje ? `${i.valor} (${pct(i.valor)}%)` : String(i.valor))
</script>

<template>
  <figure class="grafico">
    <figcaption>
      <strong>{{ titulo }}</strong>
      <span v-if="subtitulo">{{ subtitulo }}</span>
    </figcaption>
    <p v-if="!total" class="vacio">Sin datos para mostrar en este período.</p>
    <ul v-else :class="vertical ? 'columnas' : 'filas'" :aria-label="titulo">
      <li v-for="i in items" :key="i.etiqueta">
        <template v-if="vertical">
          <span class="valor">{{ i.valor }}</span>
          <span class="barra-v" :style="{ height: `${(i.valor / max) * 100}%`, background: i.color }" />
          <span class="etiqueta">{{ i.etiqueta }}</span>
        </template>
        <template v-else>
          <span class="etiqueta">{{ i.etiqueta }}</span>
          <span class="pista"><span class="barra" :style="{ width: `${(i.valor / max) * 100}%`, background: i.color }" /></span>
          <span class="valor">{{ texto(i) }}</span>
        </template>
      </li>
    </ul>
    <p v-if="total && mostrarPorcentaje" class="total">Total: {{ total }} solicitudes (100%)</p>
  </figure>
</template>
