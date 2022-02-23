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
}
interface ListProps<P> {
  [id: string]: P
}
export interface GlobalErrorProps {
  status: boolean;
  message?: string;
}
export interface GlobalDataProps {
  token: string;
  loading: boolean;
  error: GlobalErrorProps;
  columns: ListProps<ColumnProps>;
  posts: ListProps<PostProps>;
  user: UserProps
}
const asyncAndCommit = async (url: string, mutationName: string, commit: Commit, config: AxiosRequestConfig = { method: 'get' }) => {
  const { data } = await axios(url, config)
  commit(mutationName, data)
  return data
}
const store = createStore<GlobalDataProps>({
  state: {
    token: localStorage.getItem('token') || '',
    loading: false,
    // 所有用户的专栏列表的描述信息
    columns: {},
    // 当前专栏的所有文章信息
    posts: {},
    user: { isLogin: false },
    error: { status: false }
  },
  mutations: {
    createPost(state, newPost) {
      state.posts[newPost._id] = newPost
    },
    fetchColumns(state, rawData) {
      state.columns = arrToObj(rawData.data.list)
    },
    fetchColumn(state, rawData) {
      state.columns[rawData.data._id] = rawData.data
    },
    // 更新专栏的所有文章信息
    fetchPosts(state, rawData) {
      state.posts = arrToObj(rawData.data.list)
    },
    // 根据 id 更新单个文章信息
    fetchPost(state, rawData) {
      state.posts[rawData.data._id] = rawData.data
    },
    deletePost(state, { data }) {
      delete state.posts[data._id]
    },
    updatePost(state, { data }) {
      state.posts[data._id] = data
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
      localStorage.remove('token')
      delete axios.defaults.headers.common.Authorization
    }
  },
  actions: {
    // 获得专栏列表
    fetchColumns({ commit }) {
      return asyncAndCommit('/columns', 'fetchColumns', commit)
    },
    // 获取一个专栏的详情
    fetchColumn({ commit }, cid) {
      return asyncAndCommit(`/columns/${cid}`, 'fetchColumn', commit)
    },
    // 获取属于专栏的文章列表
    fetchPosts({ commit }, cid) {
      return asyncAndCommit(`/columns/${cid}/posts`, 'fetchPosts', commit)
    },
    // 获取单个文章的信息
    fetchPost({ commit }, id) {
      return asyncAndCommit(`/posts/${id}`, 'fetchPost', commit)
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
      return objToArr(state.columns)
    },
    getColumnById: (state) => (id: string) => {
      return state.columns[id]
    },
    // 根据专栏 id 筛选出当前专栏的文章
    getPostsByCid: (state) => (cid: string) => {
      return objToArr(state.posts).filter(post => post.column === cid)
    },
    getCurrentPost: (state) => (id: string) => {
      return state.posts[id]
    }
  }
})

export default store
