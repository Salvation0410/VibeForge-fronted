import axios from 'axios'
import { message } from 'ant-design-vue'

const request = axios.create({
  baseURL: 'http://localhost:8123/api',
  timeout: 60000,
  withCredentials: true,
})

request.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error),
)

request.interceptors.response.use(
  (response) => {
    const { data } = response
    if (
      data?.code === 40100 &&
      !response.config?.url?.includes('/users/login') &&
      !window.location.pathname.includes('/login')
    ) {
      message.warning('请先登录')
      window.location.href = `/login?redirect=${window.location.href}`
    }
    return response
  },
  (error) => Promise.reject(error),
)

export default request
