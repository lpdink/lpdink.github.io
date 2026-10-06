import { createApp } from 'vue'
import router from './router.js'
import App from './App.vue'
import './styles/base.css'
import './styles/design.css'

createApp(App).use(router).mount('#app')