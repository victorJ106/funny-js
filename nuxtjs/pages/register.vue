<template>
  <div class="login-container">
    <el-form class="login-form" :model="form" label-width="100px" ref="addForm" 
      size="small" :rules="rules">
      <el-form-item prop="nickname" label="昵称">
        <el-input v-model="form.nickname" placeholder="请输入昵称"></el-input>
      </el-form-item>

      <el-form-item prop="email" label="邮箱">
        <el-input v-model="form.email" placeholder="请输入邮箱"></el-input>
      </el-form-item>

      <el-form-item prop="emailCode" label="邮件验证码">
        <div class="captcha">
          <el-button type="primary" @click="sendEmailCode">发送邮件</el-button>
        </div>
        <el-input v-model="form.emailCode" placeholder="请输入邮件验证码"></el-input>
      </el-form-item>

      <el-form-item prop="captcha" label="验证码" class="captcha-container">
        <div class="captcha">
          <img :src="captcha" alt="">
        </div>
        <el-input v-model="form.captcha" placeholder="请输入验证码"></el-input>
      </el-form-item>

      <el-form-item prop="password" label="密码">
        <el-input type="password" v-model="form.password" placeholder="请输入密码"></el-input>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="submit">注册</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
  export default {
    name: 'register',
    data() {
      return {
        form: {
          email: 'victorj818@163.com',
          nickname: 'victor',
          password: '123456',
          captcha: ''
        },
        captcha: '/api/captcha',
        rules: {
          email: [
            { required: true, message: '请输入邮箱' },
            { type: 'email', message: '请输入正确的邮箱格式' }
          ],
          nickname: [
            { required: true,  message: '请输入昵称' }
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
      sendEmailCode() {
        
      },
      submit() {
        this.$refs.addForm.validate(async valid => {
          if (valid) {
            console.log('校验成功');
            const res = await this.$http.post('/user/register', this.form);
            console.log(res);
          } else {
            console.log('校验失败');
          }
        })
      }
    },
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