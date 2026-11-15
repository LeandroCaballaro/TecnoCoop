<script setup>
import { useRouter } from 'vue-router'
import { sesion, logout } from './services/auth.js'
import { puede } from './services/permisos.js'
import { supabaseConfigurado } from './lib/supabase.js'
import { ROLES } from './constants.js'

const router = useRouter()
async function salir() {
  await logout()
  router.push('/login')
}
</script>

<template>
  <div v-if="!supabaseConfigurado" class="banda">Datos de prueba · roles simulados · sin Supabase</div>
  <header class="cabecera no-imprimir">
    <h1>TecnoCoop</h1>
    <nav v-if="sesion.rol" aria-label="Principal">
      <router-link to="/">Solicitudes</router-link>
      <router-link v-if="puede(sesion.rol, 'tablero.ver')" to="/tablero">Tablero</router-link>
      <router-link v-if="puede(sesion.rol, 'informe.ver')" to="/informe">Informe</router-link>
    </nav>
    <div v-if="sesion.rol" class="usuario">
      <span>{{ ROLES[sesion.rol] }}</span>
      <button @click="salir">Salir</button>
    </div>
  </header>
  <main><router-view /></main>
</template>
