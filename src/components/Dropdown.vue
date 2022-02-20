<template>
  <div class="dropdown" ref="dropdownRef">
    <a
      href="#"
      class="btn btn-outline-light my-2 dropdown-toggle"
      @click.prevent="toggleOpen"
    >
      {{ title }}
    </a>
    <ul class="dropdown-menu" :style="{ display: 'block' }" v-if="isOpen">
      <slot></slot>
    </ul>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, onUnmounted, ref } from 'vue'

export default defineComponent({
  name: 'Dropdown',
  props: {
    title: {
      type: String,
      required: true
    }
  },
  setup() {
    const isOpen = ref(false)
    // 挂载后变成 HTMLElement 类型
    const dropdownRef = ref<null | HTMLElement>(null)
    const toggleOpen = () => {
      isOpen.value = !isOpen.value
    }
    // 第一步（详细内容看文档 4.7）
    onMounted(() => {
      document.addEventListener('click', handler)
    })
    onUnmounted(() => {
      document.removeEventListener('click', handler)
    })
    // 鼠标事件 e
    const handler = (e: MouseEvent) => {
      if (dropdownRef.value) {
        // 第二步、第三步
        if (
          !dropdownRef.value.contains(e.target as HTMLElement) &&
          isOpen.value === true
        ) {
          isOpen.value = false
        }
      }
    }
    return {
      isOpen,
      toggleOpen,
      dropdownRef
    }
  }
})
</script>
