<script setup>
import { ref, computed, onMounted } from 'vue'
import BarChart from '../components/BarChart.vue'
import { useSolicitudes, horaLegible } from '../services/useSolicitudes.js'
import { filtrar, calcularKpis, porEstado, dia } from '../services/metrics.js'
import { supabaseConfigurado } from '../lib/supabase.js'
import { ESTADO_ETIQUETA, CATEGORIAS, METAS } from '../constants.js'

const { solicitudes, estado, error, actualizado, cargar } = useSolicitudes()
onMounted(cargar)

const hoy = new Date()
const hace30 = new Date()
hace30.setDate(hoy.getDate() - 30)
const desde = ref(hace30.toISOString().slice(0, 10))
const hasta = ref(hoy.toISOString().slice(0, 10))
const interpretacion = ref('')
const imprimir = () => window.print()

const errorPeriodo = computed(() => (!desde.value || !hasta.value ? 'Elegí las dos fechas.' : desde.value > hasta.value ? 'La fecha «desde» no puede ser posterior a «hasta».' : ''))
const filtradas = computed(() => (errorPeriodo.value ? [] : filtrar(solicitudes.value, { desde: desde.value, hasta: hasta.value })))
const kpis = computed(() => calcularKpis(filtradas.value, METAS))
const periodoTexto = computed(() => `${desde.value} al ${hasta.value}`)
const fmt = (k) => (k.valor === null ? 'No calculable' : `${String(k.valor).replace('.', ',')} ${k.unidad}`)
</script>

<template>
  <h2>Informe de seguimiento</h2>
  <section class="tarjeta no-imprimir">
    <div class="filtros">
      <label>Desde <input v-model="desde" type="date" /></label>
      <label>Hasta <input v-model="hasta" type="date" /></label>
      <button class="primario" :disabled="errorPeriodo || estado !== 'listo'" @click="imprimir">Imprimir / Guardar PDF</button>
    </div>
    <p v-if="errorPeriodo" class="error" role="alert">{{ errorPeriodo }}</p>
  </section>

  <p v-if="estado === 'cargando'" class="cargando">Cargando…</p>
  <p v-else-if="estado === 'error'" class="error" role="alert">No se pudo cargar el informe: {{ error }} <button @click="cargar">Reintentar</button></p>
  <template v-else>
    <section class="tarjeta">
      <h3>1. Datos generales</h3>
      <p><strong>Propósito:</strong> explicar cómo funcionó el servicio de reparaciones en el período y sostener decisiones de mejora.</p>
      <p><strong>Destinatarios:</strong> Presidencia, Tesorería, Sindicatura y dirección de la escuela. Lo consultan los roles Administración y Consulta.</p>
      <p><strong>Frecuencia:</strong> mensual · <strong>Período:</strong> {{ periodoTexto }}</p>
      <p><strong>Objetivo:</strong> reparar equipos de la comunidad en plazo razonable, con aprendizaje aplicado.</p>
      <p><strong>Fuente:</strong> tabla de solicitudes de {{ supabaseConfigurado ? 'Supabase' : 'datos de prueba (ficticios, guardados en este navegador)' }} · actualizado {{ horaLegible(actualizado) }}.</p>
    </section>

    <p v-if="!errorPeriodo && !filtradas.length" class="vacio">No hay solicitudes en el período elegido.</p>
    <template v-else-if="!errorPeriodo">
      <section class="tarjeta">
        <h3>2. Indicadores</h3>
        <table class="tabla">
          <thead><tr><th>Indicador</th><th>Meta (ficticia)</th><th>Resultado</th><th>Estado</th></tr></thead>
          <tbody>
            <tr v-for="k in kpis" :key="k.id">
              <td data-et="Indicador">{{ k.nombre }}</td>
              <td data-et="Meta">{{ k.mejor === 'mayor' ? '≥' : '≤' }} {{ k.meta }} {{ k.unidad }}</td>
              <td data-et="Resultado">{{ fmt(k) }}<span v-if="k.valor === null"> — {{ k.motivo }}</span></td>
              <td data-et="Estado">{{ k.cumple === null ? 'Sin dato' : k.cumple ? 'Cumplida' : 'No cumplida' }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="tarjeta">
        <h3>3. Gráfico</h3>
        <BarChart titulo="Solicitudes por estado" :subtitulo="`${periodoTexto} · cantidad de solicitudes`" :items="porEstado(filtradas)" mostrar-porcentaje />
      </section>

      <section class="tarjeta">
        <h3>4. Solicitudes del período ({{ filtradas.length }})</h3>
        <table class="tabla">
          <thead><tr><th>N.º</th><th>Ingreso</th><th>Categoría</th><th>Equipo</th><th>Estado</th></tr></thead>
          <tbody>
            <tr v-for="s in filtradas" :key="s.id">
              <td data-et="N.º">#{{ s.id }}</td><td data-et="Ingreso">{{ dia(s.creada_en) }}</td><td data-et="Categoría">{{ CATEGORIAS[s.categoria] }}</td>
              <td data-et="Equipo">{{ s.equipo }}</td><td data-et="Estado">{{ ESTADO_ETIQUETA[s.estado] }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="tarjeta">
        <h3>5. Interpretación y acciones de mejora</h3>
        <label class="no-imprimir">Redactá metas cumplidas, dificultades, patrones, qué necesita más información y al menos dos acciones de mejora
          <textarea v-model="interpretacion" rows="8" />
        </label>
        <p class="solo-imprimir">{{ interpretacion || '(sin interpretación redactada)' }}</p>
      </section>
    </template>
  </template>
</template>
