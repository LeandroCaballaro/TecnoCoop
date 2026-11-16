<script setup>
import { ref } from 'vue'
import { supabaseConfigurado } from '../lib/supabase.js'
import { registrar } from '../services/auth.js'

const nombre = ref('')
const email = ref('')
const password = ref('')
const repetir = ref('')
const error = ref('')
const hecho = ref(false)
const cargando = ref(false)

async function enviar() {
  error.value = ''
  if (!nombre.value.trim()) return (error.value = 'Ingresá tu nombre.')
  if (!email.value.includes('@')) return (error.value = 'Ingresá un correo válido.')
  if (password.value.length < 8) return (error.value = 'La contraseña debe tener al menos 8 caracteres.')
  if (password.value !== repetir.value) return (error.value = 'Las contraseñas no coinciden.')
  cargando.value = true
  try {
    await registrar(nombre.value.trim(), email.value.trim(), password.value)
    hecho.value = true
  } catch (e) {
    error.value = e.message
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <section class="tarjeta angosta">
    <h2>Crear cuenta</h2>

    <p v-if="!supabaseConfigurado" class="aviso">
      El registro necesita Supabase configurado. En modo de prueba, elegí un rol en <router-link to="/login">Ingresar</router-link>.
    </p>

    <template v-else-if="hecho">
      <p class="aviso" role="status">
        Cuenta creada. Si el proyecto pide confirmar el correo, revisá tu bandeja. Un administrador tiene que asignarte un
        rol antes de que puedas usar el sistema.
      </p>
      <router-link to="/login">Ir a Ingresar</router-link>
    </template>

    <form v-else novalidate @submit.prevent="enviar">
      <label>Nombre <input v-model="nombre" type="text" autocomplete="name" /></label>
      <label>Correo <input v-model="email" type="email" autocomplete="username" /></label>
      <label>Contraseña <input v-model="password" type="password" autocomplete="new-password" /></label>
      <label>Repetir contraseña <input v-model="repetir" type="password" autocomplete="new-password" /></label>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <button class="primario" :disabled="cargando">{{ cargando ? 'Creando…' : 'Registrarme' }}</button>
      <p>¿Ya tenés cuenta? <router-link to="/login">Ingresar</router-link></p>
    </form>
  </section>
</template>
