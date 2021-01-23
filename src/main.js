import Vue from 'vue'
import App from './App.vue'
import './registerServiceWorker'

import '@mdi/font/css/materialdesignicons.css'

import Buefy from 'buefy'
import 'buefy/dist/buefy.css'

Vue.use(Buefy)

Vue.config.productionTip = false

Vue.prototype.$VERSION = APPLICATION_VERSION

new Vue({
  render: h => h(App)
}).$mount('#app')
