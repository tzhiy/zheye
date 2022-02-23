<template>
  <div class="post-detail-page">
    <Modal
      title="删除文章"
      :visible="modalIsVisible"
      @modal-on-close="modalIsVisible = false"
      @modal-on-confirm="hideAndDelete"
    >
      <p>确定要删除这篇文章吗？</p>
    </Modal>
    <article class="w-75 mx-auto mb-5 pb-3" v-if="currentPost">
      <img
        :src="currentImageUrl"
        alt="currentPost.title"
        class="rounded-lg img-fluid my-4"
        v-if="currentImageUrl"
      />
      <h2 class="mb-4">{{ currentPost.title }}</h2>
      <div
        class="
          user-profile-component
          border-top border-bottom
          py-3
          mb-5
          align-items-center
          row
          g-0
        "
      >
        <div class="col">
          <user-profile
            :user="currentPost.author"
            v-if="typeof currentPost.author === 'object'"
          ></user-profile>
        </div>
        <span class="text-muted col text-right font-italic"
          >发表于：{{ currentPost.createdAt }}</span
        >
      </div>
      <div v-html="currentHTML"></div>
      <div v-if="showEditArea" class="btn-group mt-5">
        <router-link
          type="button"
          class="btn btn-success"
          :to="{ name: 'create', query: { id: currentPost._id } }"
        >
          编辑
        </router-link>
        <button
          type="button"
          class="btn btn-danger"
          @click.prevent="modalIsVisible = true"
        >
          删除
        </button>
      </div>
    </article>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, computed, ref } from 'vue'
import MarkdownIt from 'markdown-it'
import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'
import {
  GlobalDataProps,
  PostProps,
  ImageProps,
  UserProps,
  ResponseType
} from '../store'
import UserProfile from '../components/UserProfile.vue'
import Modal from '../components/Modal.vue'
import createMessage from '@/components/createMessage'
export default defineComponent({
  name: 'post-detail',
  components: {
    UserProfile,
    Modal
  },
  setup() {
    const store = useStore<GlobalDataProps>()
    const route = useRoute()
    const router = useRouter()
    const currentId = route.params.id
    const md = new MarkdownIt()
    const modalIsVisible = ref(false)
    onMounted(() => {
      store.dispatch('fetchPost', currentId)
    })
    // 获取文章信息
    const currentPost = computed<PostProps>(() =>
      store.getters.getCurrentPost(currentId)
    )
    // 将获取的文章 Markdown 内容转化为 HTML 格式
    const currentHTML = computed(() => {
      if (currentPost.value && currentPost.value.content) {
        return md.render(currentPost.value.content)
      }
      return ''
    })
    // 根据当前文章的用户 id 是否与当前登录用户的 id 一致，判断是都显示编辑区域
    const showEditArea = computed(() => {
      const { isLogin, _id } = store.state.user
      if (currentPost.value && currentPost.value.author && isLogin) {
        const postAuthor = currentPost.value.author as UserProps
        return postAuthor._id === _id
      } else {
        return false
      }
    })
    // 添加图片链接后缀，用户修改图片大小
    const currentImageUrl = computed(() => {
      if (currentPost.value && currentPost.value.image) {
        const { image } = currentPost.value
        return (image as ImageProps).url + '?x-oss-process=image/resize,w_850'
      } else {
        return null
      }
    })
    // 处理“确定删除”的弹窗
    const hideAndDelete = () => {
      modalIsVisible.value = false
      store
        .dispatch('deletePost', currentId)
        .then((rawData: ResponseType<PostProps>) => {
          createMessage('删除成功，2 秒之后跳转到专栏首页', 'success')
          setTimeout(() => {
            router.push({ name: 'column', params: { id: rawData.data.column } })
          }, 2000)
        })
    }
    return {
      currentPost,
      currentImageUrl,
      currentHTML,
      showEditArea,
      modalIsVisible,
      hideAndDelete
    }
  }
})
</script>
