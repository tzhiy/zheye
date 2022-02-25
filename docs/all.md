## 4 准备工作和第一个页面

1. 使用 bootstrap

   安装 bootstrap

   ```
   npm install bootstrap --save
   ```

   引入 bootstrap

   ```js
   import "bootstrap/dist/css/bootstrap.min.css";
   ```

   通过类名设置元素样式。

2. 设计图拆分

   根据设计图划分组件的层级，然后创建静态版本，这个时候不要想逻辑的实现。

3. 将构造函数断言成类型

   组件传递的参数设置不能直接断言成类型，因为它是构造函数，使用 PropType 则可以进行断言

   ```js
   props: {
     list: {
       type: Array as ColumnProps[], // x
       type: Array as PropType<ColumnProps[]>, // √
       required: true,
     },
   },
   ```

4. 在模板中使用 vue

   修改 vetur 的设置，添加

   ```
   "vetur.experimental.templateInterpolationService": true, 
   ```

   它将 vue 转为 Typescript，再通过 language server 分析语法，再转化为 vue 文件

5. 在 `.eslintrc.js` 和 `.prettierrc.js` 中进行相应配置，解决冲突

6. 语义化：在 Dropdown 中使用插槽加入 DropdownItem

   ```html
   <Dropdown>
       <DropdownItem></DropdownItem>
       <DropdownItem></DropdownItem>
       <DropdownItem></DropdownItem>
   </Dropdown>
   ```

7. 实现点击 Dropdown 组件外区域，组件自动隐藏

   1. 在外层 document 绑定点击事件
   2. 通过 event.target 拿到点击的元素
   3. 判断 component 是否包含点击元素：若包含则在内部，继续显示；若不包含则在外部，隐藏组件

## 5 Web 世界的经典元素 - 表单

1. 表单的基本功能是验证

   在 blur 时验证单个输入；在提交时验证所有输入
   
   ```js
   // 输入对象
   const emailRef = reactive({
     val: '',
     error: false,
     message: ''
   })
   ```
   
2. 使用 v-model 在组件中传值

   ```html
   <custom-input
     v-model="searchText"
   ></custom-input>
   ```

   在组件中使用 v-model 相当于：

   ```html
   <custom-input
     :model-value="searchText"
     @update:model-value="searchText = $event"
   ></custom-input>
   ```

   在组件中用 `props` 接收值，用 `context.emit('@update:modelValue', newValue)` 更新

3. 非 Prop 的 Attribute 会被添加到根元素上

   禁用继承可使用 `inheritAttrs: false`

   `v-bind="$attrs"` 可以在指定元素上添加 Attribute

4. 具名插槽 `v-slot:submit`，实现在一个组件中多处使用插槽

5. validateForm 要拿到 validateItem 的验证方法，从而在点击提交按钮时验证所有输入

   通过对组件的 ref 引用可以得到它的方法

   ```html
   <ValidateInput ref="inputRef" />
   ```

   ```js
   const inputRef = ref<any>()
   inputRef.value.validateInput()
   ```

   因为 validateForm 中的 slot 中无法使用 ref 属性，且无法拿到多个 validateItem，我们需要使用 mitt 库的事件监听器来获得内容

   ```js
   import mitt from 'mitt'
   type Events = { 'form-item-created': string }
   export const emitter = mitt<Events>()
   const callback = (test: string) => {
      console.log(test)
   }
   emitter.on('form-item-created', callback)
   // off ...
   // emit ...
   ```

## 6 Vue Router 和 Vuex

1. 单页面：速度快、无缝衔接、前后端分离

   `history.pushState(state, title, url)` 可以实现添加一条历史记录，跳转到相应 url 但是不刷新页面
   
2. 由于 SPA，我们需要更好地管理全局数据

   全局对象的弊端：数据不是响应式，数据修改不可追踪，不符合组件开发原则

   状态管理工具：store 的全局数据结构，只能调用特殊的方法修改数据（可预测）

3. 使用 computed 获取 state 对象

   ```js
   const list = computed(() => store.state.columns)
   ```

   computed 返回一个值不可变的响应式对象，reactive 返回值可变的响应式对象

   store 中是属性只能通过 commit 修改，因此不能使用 reactive

4. getter 帮助我们在获取数据时获得计算结果

5. 前置守卫：在进入页面前判断是否登录并跳转到相应页面

   元信息 `meta`：在每个页面设置信息，便于守卫个性化

   ```js
   router.beforeEach((to, from, next) => {
     if (to.meta.requireLogin && !store.state.user.isLogin) {
       next({ name: 'login' })
     } else if (to.meta.redirectAlreadyLogin && store.state.user.isLogin) {
       next({ name: 'home' })
     } else {
       next()
     }
   })
   ```

## 7 项目整合后端接口

1. [什么是 RESTful API？](http://www.ruanyifeng.com/blog/2014/05/restful_api.html)

2. [接口文档](http://api.vikingship.xyz)

3. 使用 axios：

   ```js
   axios.get('http://apis.imooc.com/api/columns?icode=FD553DD0219F1FC4').then(resp => {
     console.log(resp)
   })
   ```

   优化请求方法，设置 baseUrl，使用拦截器传递参数：

   ```js
   axios.defaults.baseURL = 'http://apis.imooc.com/api'
   // 使用 interceptors 拦截请求，给每次请求加入 icode 参数
   axios.interceptors.request.use(config => {
     config.params = { ...config.params, icode: 'FD553DD0219F1FC4' }
     return config
   })
   axios.get('/columns').then(resp => {
     console.log(resp)
   })
   ```

   最终配置：

   ```js
   // 替换 baseURL
   axios.defaults.baseURL = 'http://apis.imooc.com/api/'
   // 下面的 icode 值是从慕课网获取的 token 值
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
   ```

4. mutations 中使用异步函数会破坏数据的可追溯性，因此在 actions 中使用异步函数

5. 添加全局 loading，在每次请求前设置：

   ```js
   const getAndCommit = async (url: string, mutationName: string, commit: Commit) => {
     commit('setLoading', true)
     const { data } = await axios.get(url)
     commit(mutationName, data)
     await new Promise(resolve => setTimeout(resolve, 3000))
     commit('setLoading', false)
   }
   ```

   使用拦截器（见本次 git 同步提交的代码）

## 8 通行凭证 - 权限管理

1. session 和 token

   session 将信息保存在服务器，返回 sessionId 保存到 cookie 中

   token 将信息保存在客户端，返回的 token 通过 cookie（不容易跨域）或在 header 的 Authorization 首部字段中

2. 设置通用 header：

   ```js
    axios.defaults.headers.common.Authorization = `Bearer ${token}`
   ```

3. 组合 action：

   ```js
   loginAndFetch({ dispatch }, loginData) {
     return dispatch('login', loginData).then(() => {
       return dispatch('fetchCurrentUser')
     })
   }
   ```

4. 在 localStorage 中持久化存储登录状态

5. 通用错误处理，在拦截器中处理错误情况

## 9 上传组件

1. 提交文件有两种方法：form 标签和 JavaScript 异步请求

   1. form 标签

      ```html
      <form method="post" enctype="multipart/form-data" action="/api/upload">
        <input type="file" name="file">
        <button type="submit">Submit</button>
      </form>
      ```

   2. JavaScript 发送异步请求（见 git 同步提交的代码）

2. 隐藏 input 元素，通过点击 button 按钮触发 input 的点击事件

3. slot 传参

## 10 编辑和删除文章

1. props 传参修改后，子组件的值不会随之发生变化，v-model 是一种语法糖，本质上也是 props 传参

   这是因为 props 是响应式对象，它是一种特定的响应式，称为只读响应式对象，所以你不能改变它的值，但是可以 watch 它的改变

   ```js
   const uploadedData = ref(props.uploaded) // props 改变时，uploadedData 不变
   ```

   ```js
   watch(
     () => props.uploaded,
     newValue => {
       if (newValue) {
         uploadedData.value = newValue // props 改变时，uploadedData 改变
       }
     }
   )
   ```

2. 在 ValidateInput 中修改输入框的数据时，watch 函数会再次触发，不符合预期

   使用 computed 的 getter 和 setter 处理数据，可以不触发 watch

   ```js
   val: computed({
     get: () => props.modelValue || '',
     set: val => {
       context.emit('update:modelValue', val)
     }
   }),
   ```

   这样做可以动态使用 props
   
## 11 持续优化

1. 数据结构优化
   1. store 中存在大量的遍历数组操作，可以把数组改为对象，降低遍历时间复杂度
   2. flattern state
   
2. 防止重复请求

   通过数组来记录所有加载完成的专栏 id

## 12 项目构建与部署

1. 开发环境和生产环境

   1. 开发环境：`npm run serve`

      有尽量丰富的信息帮助定位问题；使用本地数据或 mock 数据；开发服务器的便利功能

   2. 生产环境：`npm run build`

      尽量消除程序错误和调试信息；使用线上真实数据；速度第一

2. 使用 GitHub Pages 部署（暂未部署）

3. 使用轻服务部署 [zheye (cloudendpoint.cn)](https://zhihu.web.cloudendpoint.cn/)

4. 使用 nginx

