<script setup>
import { ref, computed } from 'vue'
import { solicitudes, ESTADOS } from '../data/mock'

const estado = ref('')
const lista = computed(() => solicitudes.filter((s) => !estado.value || s.estado === estado.value))
</script>

<template>
  <h2>Solicitudes</h2>
  <select v-model="estado" aria-label="Filtrar por estado">
    <option value="">Todos los estados</option>
    <option v-for="e in ESTADOS" :key="e" :value="e">{{ e.replace('_', ' ') }}</option>
  </select>
  <ul>
    <li v-for="s in lista" :key="s.id">#{{ s.id }} · {{ s.equipo }} · {{ s.falla }} · {{ s.estado }}</li>
    <li v-if="!lista.length">No hay solicitudes con ese estado.</li>
  </ul>
</template>
