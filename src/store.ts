import { createStore, Commit } from 'vuex'
import axios, { AxiosRequestConfig } from 'axios'
import { arrToObj, objToArr } from './helper'
export interface ResponseType<P> {
  code: number
  msg: string
  data: P
}
export interface ImageProps {
  _id?: string
  url?: string
  createdAt?: string
  fitUrl?: string
}
export interface UserProps {
  isLogin: boolean;
  nickName?: string;
  _id?: string;
  column?: string;
  email?: string;
  avatar?: ImageProps;
  description?: string;
}
export interface ColumnProps {
  _id: string;
  title: string;
  avatar?: ImageProps;
  description: string;
}
export interface PostProps {
  _id?: string;
  title: string;
  excerpt?: string;
  content?: string;
  image?: ImageProps | string;
  createdAt?: string;
  column: string;
  author?: string | UserProps
  isHTML?: boolean
}
export interface ListProps<P> {
  [id: string]: P
}
export interface GlobalErrorProps {
  status: boolean;
  message?: string;
}
export interface GlobalColumnsProps {
  data: ListProps<ColumnProps>;
  total: number;
  // 记录加载到了哪一页
  currentPage: number
}
export interface GlobalDataProps {
  token: string;
  loading: boolean;
  error: GlobalErrorProps;
  columns: GlobalColumnsProps;
  posts: { data: ListProps<PostProps>; loadedColumns: string[] };
  user: UserProps
}
const asyncAndCommit = async (url: string, mutationName: string,
  commit: Commit, config: AxiosRequestConfig = { method: 'get' }, extraData?: any) => {
  const { data } = await axios(url, config)
  if (extraData) {
    commit(mutationName, { data, extraData })
  } else {
    commit(mutationName, data)
  }
}
const store = createStore<GlobalDataProps>({
  state: {
    token: localStorage.getItem('token') || '',
    loading: false,
    // 所有用户的专栏列表的描述信息
    columns: { data: {}, total: 0, currentPage: 0 },
    // 已加载专栏的所有文章信息，loadedColumns 保存已加载的列表信息
    posts: { data: {}, loadedColumns: [] },
    user: { isLogin: false },
    error: { status: false }
  },
  mutations: {
    createPost(state, newPost) {
      state.posts.data[newPost._id] = newPost
    },
    fetchColumns(state, rawData) {
      const { data } = state.columns
      const { list, count, currentPage } = rawData.data
      // 参数：已经获取的专栏信息、后端专栏总数、是否已经加载
      state.columns = {
        data: { ...data, ...arrToObj(list) },
        currentPage: +currentPage,
        total: count
      }
    },
    fetchColumn(state, rawData) {
      state.columns.data[rawData.data._id] = rawData.data
    },
    // 获取专栏的文章信息，添加到 posts 对象中
    fetchPosts(state, { data: rawData, extraData: columnId }) {
      state.posts.data = { ...state.posts.data, ...arrToObj(rawData.data.list) }
      state.posts.loadedColumns.push(columnId)
    },
    // 根据 id 更新单个文章信息
    fetchPost(state, rawData) {
      state.posts.data[rawData.data._id] = rawData.data
    },
    deletePost(state, { data }) {
      delete state.posts.data[data._id]
    },
    updatePost(state, { data }) {
      state.posts.data[data._id] = data
    },
    setLoading(state, status) {
      state.loading = status
    },
    setError(state, e: GlobalErrorProps) {
      state.error = e
    },
    fetchCurrentUser(state, rawData) {
      state.user = { isLogin: true, ...rawData.data }
    },
    login(state, rawData) {
      const { token } = rawData.data
      state.token = token
      localStorage.setItem('token', token)
      axios.defaults.headers.common.Authorization = `Bearer ${token}`
    },
    logout(state) {
      state.token = ''
      state.user = { isLogin: false }
      localStorage.removeItem('token')
      delete axios.defaults.headers.common.Authorization
    }
  },
  actions: {
    // 获得专栏列表
    fetchColumns({ state, commit }, params = {}) {
      const { currentPage = 1, pageSize = 6 } = params
      // 已保存的专栏页数小于要获取的页数
      if (state.columns.currentPage < currentPage) {
        return asyncAndCommit(`/columns?currentPage=${currentPage}&pageSize=${pageSize}`, 'fetchColumns', commit)
      }
    },
    // 获取一个专栏的详情
    fetchColumn({ state, commit }, cid) {
      if (!state.columns.data[cid]) {
        return asyncAndCommit(`/columns/${cid}`, 'fetchColumn', commit)
      }
    },
    // 获取属于专栏的文章列表
    fetchPosts({ state, commit }, cid) {
      if (!state.posts.loadedColumns.includes(cid)) {
        return asyncAndCommit(`/columns/${cid}/posts`, 'fetchPosts', commit, { method: 'get' }, cid)
      }
    },
    // 获取单个文章的信息
    fetchPost({ state, commit }, id) {
      const currentPost = state.posts.data[id]
      // 由于获取文章列表时不会返回详细的 content
      // 所以没有 id 这篇文章或这篇文章没有 content 属性时才需要请求详细信息
      if (!currentPost || !currentPost.content) {
        return asyncAndCommit(`/posts/${id}`, 'fetchPost', commit)
      } else {
        // 否则不需要获取详细信息
        // 由于修改文章时需要用到返回的信息，所以手动返回一个 Promise
        return Promise.resolve({ data: currentPost })
      }
    },
    // 更新单个文章的信息
    updatePost({ commit }, { id, payload }) {
      return asyncAndCommit(`/posts/${id}`, 'fetchPost', commit, {
        method: 'patch',
        data: payload
      })
    },
    // 获取当前用户的信息
    fetchCurrentUser({ commit }) {
      return asyncAndCommit('/user/current', 'fetchCurrentUser', commit)
    },
    login({ commit }, payload) {
      return asyncAndCommit('/user/login', 'login', commit, { method: 'post', data: payload })
    },
    createPost({ commit }, payload) {
      return asyncAndCommit('/posts', 'createPost', commit, { method: 'post', data: payload })
    },
    deletePost({ commit }, id) {
      return asyncAndCommit(`/posts/${id}`, 'deletePost', commit, { method: 'delete' })
    },
    // 组合 action
    loginAndFetch({ dispatch }, loginData) {
      return dispatch('login', loginData).then(() => {
        return dispatch('fetchCurrentUser')
      })
    }
  },
  getters: {
    getColumns: (state) => {
      return objToArr(state.columns.data)
    },
    getColumnById: (state) => (id: string) => {
      return state.columns.data[id]
    },
    // 根据专栏 id 筛选出当前专栏的文章
    getPostsByCid: (state) => (cid: string) => {
      return objToArr(state.posts.data).filter(post => post.column === cid)
    },
    getCurrentPost: (state) => (id: string) => {
      return state.posts.data[id]
    }
  }
})

export default store
