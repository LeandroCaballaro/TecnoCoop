import { createRouter, createWebHistory } from 'vue-router'
import { sesion } from '../services/auth.js'
import { puede } from '../services/permisos.js'
import SolicitudesView from '../views/SolicitudesView.vue'
import LoginView from '../views/LoginView.vue'
import RegistroView from '../views/RegistroView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: LoginView },
    { path: '/registro', name: 'registro', component: RegistroView },
    { path: '/', name: 'solicitudes', component: SolicitudesView, meta: { privada: true } },
    { path: '/tablero', name: 'tablero', component: () => import('../views/TableroView.vue'), meta: { privada: true, permiso: 'tablero.ver' } },
    { path: '/informe', name: 'informe', component: () => import('../views/InformeView.vue'), meta: { privada: true, permiso: 'informe.ver' } },
    { path: '/:cualquiera(.*)*', redirect: '/' },
  ],
})

router.beforeEach((to) => {
  if (to.meta.privada && !sesion.rol) return { name: 'login', query: { redirect: to.fullPath } }
  if (to.meta.permiso && !puede(sesion.rol, to.meta.permiso)) return { name: 'solicitudes' }
  if ((to.name === 'login' || to.name === 'registro') && sesion.rol) return { name: 'solicitudes' }
})

export default router
