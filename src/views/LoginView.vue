<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabaseConfigurado } from '../lib/supabase.js'
import { login, loginSimulado } from '../services/auth.js'
import { ROLES } from '../constants.js'

const router = useRouter()
const route = useRoute()
const email = ref('')
const password = ref('')
const error = ref('')
const cargando = ref(false)
const destino = () => route.query.redirect || '/'

async function entrar() {
  error.value = ''
  if (!email.value.includes('@') || !password.value) {
    error.value = 'Ingresá tu correo y tu contraseña.'
    return
  }
  cargando.value = true
  try {
    await login(email.value.trim(), password.value)
    router.push(destino())
  } catch (e) {
    error.value = e.message
  } finally {
    cargando.value = false
  }
}

function elegirRol(rol) {
  loginSimulado(rol)
  router.push(destino())
}
</script>

<template>
  <section class="tarjeta angosta">
    <h2>Ingresar</h2>

    <form v-if="supabaseConfigurado" novalidate @submit.prevent="entrar">
      <label>Correo <input v-model="email" type="email" autocomplete="username" /></label>
      <label>Contraseña <input v-model="password" type="password" autocomplete="current-password" /></label>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <button class="primario" :disabled="cargando">{{ cargando ? 'Ingresando…' : 'Ingresar' }}</button>
      <p>¿No tenés cuenta? <router-link to="/registro">Registrate</router-link></p>
    </form>

    <template v-else>
      <p class="aviso">
        <strong>Roles simulados.</strong> Supabase no está configurado: elegí un rol para probar. No hay contraseña ni
        seguridad real; los datos son ficticios y quedan solo en este navegador.
      </p>
      <button v-for="(nombre, rol) in ROLES" :key="rol" class="rol" @click="elegirRol(rol)">{{ nombre }}</button>
    </template>
  </section>
</template>
