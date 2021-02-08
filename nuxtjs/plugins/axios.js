import Vue from 'vue';
import axios from 'axios';
import { MessageBox } from 'element-ui';

let service = axios.create({
  timeout: 30000,
  baseURL: 'api/'
});

const TOKEN_KEY = 'token';

export default({ store, redirect }) => {
  service.interceptors.request.use(config => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.common.authorization = 'token:' + token;
    }
    return config;
  }, err => {
    return Promise.reject(err);
  })
  service.interceptors.response.use(response => {
    console.log('=====.', response)
    const { data, config } = response;
    if (data.code === 0) {
      console.log(config)
      if (config.url === '/user/login') {
        localStorage.setItem(TOKEN_KEY, data.data.token);
      }
    } else if (data.code === -2) {
      MessageBox.confirm('登录过期了，请重新登录', '提示', {
        showCancelButton: false,
        type: 'info'
      }).then(() => {
        localStorage.removeItem(TOKEN_KEY);
        redirect({ path: '/login' });
      })
    }
    return data;
  }, error => {
    return Promise.reject(error);
  })
}

Vue.prototype.$http = service;

export const http = service;