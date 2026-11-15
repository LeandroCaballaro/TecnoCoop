import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { iniciarSesion } from './services/auth.js'
import './style.css'

// La sesión se restaura antes de montar, para que las guardias del router ya la conozcan.
iniciarSesion().finally(() => createApp(App).use(router).mount('#app'))
