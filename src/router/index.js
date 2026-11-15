import { createRouter, createWebHistory } from 'vue-router'
import SolicitudesView from '../views/SolicitudesView.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [{ path: '/', name: 'solicitudes', component: SolicitudesView }],
})
