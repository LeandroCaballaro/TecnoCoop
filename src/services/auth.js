import { reactive } from 'vue'
import { supabase, supabaseConfigurado } from '../lib/supabase.js'
import { ROLES } from '../constants.js'

// simulado = true: el rol se elige sin contraseña (solo para la demo sin Supabase).
export const sesion = reactive({ usuario: null, rol: null, simulado: false })
const KEY = 'tecnocoop.sesion'

async function cargarPerfil(user) {
  const { data, error } = await supabase.from('perfiles').select('rol').eq('id', user.id).single()
  if (error || !data || data.rol === 'pendiente') {
    await supabase.auth.signOut()
    throw new Error('Tu cuenta no tiene un rol asignado. Pedile a Administración que lo cargue.')
  }
  Object.assign(sesion, { usuario: user, rol: data.rol, simulado: false })
}

export async function iniciarSesion() {
  try {
    if (supabaseConfigurado) {
      const { data } = await supabase.auth.getSession()
      if (data.session) await cargarPerfil(data.session.user)
    } else {
      const rol = localStorage.getItem(KEY)
      if (ROLES[rol]) Object.assign(sesion, { usuario: { id: null, email: 'rol simulado' }, rol, simulado: true })
    }
  } catch {
    /* sin sesión previa */
  }
}

export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error('Correo o contraseña incorrectos.')
  await cargarPerfil(data.user)
}

export async function registrar(nombre, email, password) {
  const { error } = await supabase.auth.signUp({ email, password, options: { data: { nombre } } })
  if (error) {
    if (/already|registered/i.test(error.message)) throw new Error('Ese correo ya está registrado.')
    if (/password/i.test(error.message)) throw new Error('La contraseña no es válida: probá con una más larga.')
    throw new Error('No se pudo crear la cuenta: ' + error.message)
  }
  // Si Supabase abrió sesión al registrar, se cierra: el rol lo asigna un admin.
  await supabase.auth.signOut()
}

export function loginSimulado(rol) {
  if (supabaseConfigurado || !ROLES[rol]) return
  try {
    localStorage.setItem(KEY, rol)
  } catch {
    /* la sesión dura hasta cerrar la pestaña */
  }
  Object.assign(sesion, { usuario: { id: null, email: 'rol simulado' }, rol, simulado: true })
}

export async function logout() {
  if (supabaseConfigurado) await supabase.auth.signOut()
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* nada */
  }
  Object.assign(sesion, { usuario: null, rol: null, simulado: false })
}
