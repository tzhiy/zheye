import { createApp } from 'vue'
import router from './router'
import store from './store'
import axios from 'axios'

import App from './App.vue'

// 替换 baseURL
axios.defaults.baseURL = 'http://apis.imooc.com/api/'
// 下面的 icode 值是从慕课网获取的 token 值，可以在课程右侧的项目接口校验码找到
axios.interceptors.request.use(config => {
  // ... 其他代码
  // get 请求，添加到 url 中
  config.params = { ...config.params, icode: 'FD553DD0219F1FC4' }
  // 其他请求，添加到 body 中
  // 如果是上传文件，添加到 FormData 中
  if (config.data instanceof FormData) {
    config.data.append('icode', 'FD553DD0219F1FC4')
  } else {
    // 普通的 body 对象，添加到 data 中
    config.data = { ...config.data, icode: 'FD553DD0219F1FC4' }
  }
  return config
})

axios.get('/columns').then(resp => {
  console.log(resp)
})

const app = createApp(App)
app.use(router)
app.use(store)
app.mount('#app')
