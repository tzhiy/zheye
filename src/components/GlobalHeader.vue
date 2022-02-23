<template>
  <nav class="navbar navbar-dark bg-primary justify-content-between mb-4 px-4">
    <router-link class="navbar-brand" to="/">者也专栏</router-link>
    <ul v-if="!user.isLogin" class="list-inline mb-0">
      <li class="list-inline-item">
        <router-link to="/login" class="btn btn-outline-light my-2"
          >登陆</router-link
        >
      </li>
      <li class="list-inline-item">
        <router-link to="/signup" class="btn btn-outline-light my-2"
          >注册</router-link
        >
      </li>
    </ul>
    <ul v-else class="list-inline mb-0">
      <li class="list-inline-item">
        <Dropdown :title="`你好 ${user.nickName}`">
          <DropdownItem>
            <router-link to="/create" class="dropdown-item">
              新建文章
            </router-link>
          </DropdownItem>
          <DropdownItem>
            <router-link :to="`/column/${user.column}`" class="dropdown-item">
              我的专栏
            </router-link>
          </DropdownItem>
          <DropdownItem>
            <a href="#" class="dropdown-item" @click.prevent="logout">
              退出登录
            </a>
          </DropdownItem>
        </Dropdown>
      </li>
    </ul>
  </nav>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import Dropdown from './Dropdown.vue'
import DropdownItem from './DropdownItem.vue'
import store, { UserProps } from '../store'
import createMessage from './createMessage'
import { useRouter } from 'vue-router'
export default defineComponent({
  name: 'GlobalHeader',
  components: {
    Dropdown,
    DropdownItem
  },
  props: {
    user: {
      type: Object as PropType<UserProps>,
      required: true
    }
  },
  setup() {
    const router = useRouter()
    const logout = () => {
      store.commit('logout')
      createMessage('登出成功，2 秒后跳转到登录！', 'success')
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    }
    return {
      logout
    }
  }
})
</script>
