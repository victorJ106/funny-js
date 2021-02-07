<template>
  <div class="login-container">
    <el-form class="login-form" :model="form" label-width="100px" ref="loginForm" size="small">
      <el-form-item prop="email" label="邮箱">
        <el-input v-model="form.email" placeholder="请输入邮箱"></el-input>
      </el-form-item>

      <el-form-item prop="captcha" label="验证码">
        <div class="captcha">
          <img :src="captcha" alt="">
        </div>
        <el-input v-model="form.captcha" placeholder="请输入验证码"></el-input>
      </el-form-item>

      <el-form-item prop="password" label="密码">
        <el-input type="password" v-model="form.password" placeholder="请输入密码"></el-input>
      </el-form-item>

      <el-form-item>
        <el-button @click="onLogin" type="primary">登录</el-button>
        <nuxt-link to="/register">
          <el-button type="primary">去注册</el-button>
        </nuxt-link>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
  export default {
    name: 'login',
    data() {
      return {
        form: {
          email: 'victorj818@163.com',
          password: '123456',
          captcha: ''
        },
        captcha: '/api/captcha',
        rules: {
          email: [
            { required: true, message: '请输入邮箱' },
            { type: 'email', message: '请输入正确的邮箱格式' }
          ],
          password: [
            { required: true, message: '请输入密码 ' }
          ],
          captcha: [
            { required: true, message: '请输入验证码' }
          ]
        }
      }
    },
    methods: {
      onLogin() {
        console.log(this.form)
        this.$refs.loginForm.validate(async valid =>  {
          if (!valid) return;
          const res = await this.$http.post('/user/login', this.form);
          console.log(res);
        })
      }
    }
  }
</script>

<style lang="scss" scoped>
  .login-container {
    width: 100%;
    padding: 100px 0;
    .login-form {
      width: 30%;
      margin: 0 auto;
    }
  }
</style>