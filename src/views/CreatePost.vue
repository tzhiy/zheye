<template>
  <div class="create-post-page">
    <h4>{{ isEditMode ? '编辑文章' : '新建文章' }}</h4>
    <Uploader
      action="/upload"
      class="
        d-flex
        align-items-center
        justify-content-center
        bg-light
        text-secondary
        w-100
        my-4
      "
      :beforeUpload="uploadCheck"
      :uploaded="uploadData"
      @file-uploaded="handleFileUploaded"
    >
      <h2>点击上传头图</h2>
      <template #loading>
        <div class="d-flex">
          <div class="spinner-border text-secondary" role="status"></div>
          <h2>正在上传</h2>
        </div>
      </template>
      <template #uploaded="dataProps">
        <img :src="dataProps.uploadedData.data.url" />
      </template>
    </Uploader>
    <validate-form @form-submit="onFormSubmit">
      <div class="mb-3">
        <label class="form-label">文章标题：</label>
        <validate-input
          :rules="titleRules"
          v-model="titleVal"
          placeholder="请输入文章标题"
          type="text"
        />
      </div>
      <div class="mb-3">
        <label class="form-label">文章详情：</label>
        <validate-input
          rows="10"
          type="text"
          tag="textarea"
          placeholder="请输入文章详情"
          :rules="contentRules"
          v-model="contentVal"
        />
      </div>
      <template #submit>
        <button class="btn btn-primary btn-large">
          {{ isEditMode ? '编辑文章' : '发表文章' }}
        </button>
      </template>
    </validate-form>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue'
import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'
import { GlobalDataProps, ImageProps, PostProps, ResponseType } from '../store'
import ValidateInput, { RulesProp } from '../components/ValidateInput.vue'
import ValidateForm from '../components/ValidateForm.vue'
import Uploader from '../components/Uploader.vue'
import { beforeUploadCheck } from '@/helper'
import createMessage from '@/components/createMessage'
export default defineComponent({
  name: 'Login',
  components: {
    ValidateInput,
    ValidateForm,
    Uploader
  },
  setup() {
    const uploadData = ref()
    const titleVal = ref('')
    const router = useRouter()
    const route = useRoute()
    // 判断是否是编辑模式
    const isEditMode = !!route.query.id
    const store = useStore<GlobalDataProps>()
    let imageId = ''
    const titleRules: RulesProp = [
      { type: 'required', message: '文章标题不能为空' }
    ]
    const contentVal = ref('')
    const contentRules: RulesProp = [
      { type: 'required', message: '文章详情不能为空' }
    ]
    onMounted(() => {
      // 是编辑模式，则先获取当前的文章信息，填入到文本框和图片中
      if (isEditMode) {
        store
          .dispatch('fetchPost', route.query.id)
          .then((rawData: ResponseType<PostProps>) => {
            const currentPost = rawData.data
            if (currentPost.image) {
              uploadData.value = { data: currentPost.image }
            }
            titleVal.value = currentPost.title
            contentVal.value = currentPost.content || ''
          })
      }
    })
    // 图片上传后获得图片的 id，多次提交会更新
    const handleFileUploaded = (rawData: ResponseType<ImageProps>) => {
      if (rawData.data._id) {
        imageId = rawData.data._id
      }
    }
    // 提交表单
    const onFormSubmit = (result: boolean) => {
      if (result) {
        const { column, _id } = store.state.user
        if (column) {
          // 将文章内容和图片 id 添加到上传 body 中
          const newPost: PostProps = {
            author: _id,
            title: titleVal.value,
            content: contentVal.value,
            column
          }
          if (imageId) {
            newPost.image = imageId
          }
          // 根据编辑模式或创建模式调用不同的方法更新数据
          const actionName = isEditMode ? 'updatePost' : 'createPost'
          const sendData = isEditMode
            ? { id: route.query.id, payload: newPost }
            : newPost
          store.dispatch(actionName, sendData).then(() => {
            createMessage('发布成功，2秒后跳转到文章列表', 'success')
            setTimeout(() => {
              router.push({ name: 'column', params: { id: column } })
            }, 2000)
          })
        }
      }
    }
    // 上传图片之前进行的自定义检查函数，返回值为 false 则终止上传过程
    const uploadCheck = (file: File) => {
      const result = beforeUploadCheck(file, {
        format: ['image/jpeg', 'image/png'],
        size: 1
      })
      const { passed, error } = result
      if (error === 'format') {
        createMessage('上传的图片只能是 JPG 或 PNG 格式！', 'error')
      } else if (error === 'size') {
        createMessage('上传图片大小不能超过 1 Mb！', 'error')
      }
      return passed
    }
    return {
      titleRules,
      titleVal,
      contentVal,
      contentRules,
      onFormSubmit,
      uploadCheck,
      handleFileUploaded,
      uploadData,
      isEditMode
    }
  }
})
</script>

<style>
.create-post-page .file-upload-container {
  height: 200px;
  cursor: pointer;
}
.create-post-page .file-upload-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
