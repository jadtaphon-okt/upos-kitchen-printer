import { IonicVue } from '@ionic/vue'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import Toast from './plugins/Toast'
import Alert from './plugins/Alert'
// import VConsole from 'vconsole'
// new VConsole()

import '@ionic/vue/css/core.css'
import '@ionic/vue/css/normalize.css'
import '@ionic/vue/css/structure.css'
import '@ionic/vue/css/typography.css'
import '@ionic/vue/css/padding.css'
import '@ionic/vue/css/float-elements.css'
import '@ionic/vue/css/text-alignment.css'
import '@ionic/vue/css/text-transformation.css'
import '@ionic/vue/css/flex-utils.css'
import '@ionic/vue/css/display.css'
import '@ionic/vue/css/palettes/dark.system.css'
import './theme/variables.css'

const registerPlugins = (app: ReturnType<typeof createApp>) => {
    app.config.globalProperties.$toast = new Toast()
    app.config.globalProperties.$alert = new Alert()
    app.use(IonicVue).use(router)
}

const app = createApp(App)

registerPlugins(app)

router.isReady().then(() => {
    app.mount('#app')
})
