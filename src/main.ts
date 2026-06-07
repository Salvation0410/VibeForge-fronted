import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import { ensureLoginUserBootstrapped } from '@/bootstrap/loginUser'
import { useLoginUserStore } from '@/stores/loginUser'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(Antd)

const loginUserStore = useLoginUserStore(pinia)
void ensureLoginUserBootstrapped(loginUserStore)

app.mount('#app')
