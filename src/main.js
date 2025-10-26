import { createApp } from 'vue'
import { createRouter,createWebHashHistory} from 'vue-router'
import './style.css'
import App from './App.vue'
import stockAnalysis from './vueTemplate/stockAnalysis.vue'
import KLineChart from './vueTemplate/kLineChart.vue'
import threeMajorInstitutions from './vueTemplate/threeMajorInstitutions.vue'


const routes = [
    {
        path:'/',
        name:'Home',
        component:stockAnalysis
    },
    {
        path:'/kline',
        name:'KLine',
        component:KLineChart
    },
    {
        path:'/threemajor',
        name:'threemajor',
        component:threeMajorInstitutions
    }
]

const router = createRouter({
    history:createWebHashHistory(),
    routes,
})

const app = createApp(App)
app.use(router)
app.mount('#app')
