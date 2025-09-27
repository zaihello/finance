import { createApp } from 'vue'
import { createRouter,createWebHashHistory} from 'vue-router'
import './style.css'
import App from './App.vue'
import stockAnalysis from './vueTemplate/stockAnalysis.vue'


const routes = [
 {path:'/',component:stockAnalysis}
]

const router = createRouter({
    history:createWebHashHistory(),
    routes,
})

const app = createApp(App)
app.use(router)
app.mount('#app')
