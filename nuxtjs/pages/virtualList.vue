<template>
  <div class="main-wrapper">
    <h2>虚拟列表实现</h2>
    <div class="list-wrapper">
      <div class="list-item" v-for="(item, index) in list" :key="index">
        {{index + 1}}. {{item.name}}
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'virtual-list-example',
    data() {
      return {
        list: [
          { name: 'sdfsdfsd' },{ name: 'sdfsdfsd' },{ name: 'sdfsdfsd' },
          { name: 'sdfsdfsd' },{ name: 'sdfsdfsd' },{ name: 'sdfsdfsd' },
          { name: 'sdfsdfsd' },{ name: 'sdfsdfsd' },{ name: 'sdfsdfsd' },
        ]
      }
    },
  }
</script>

<style lang="scss" scoped>
  .main-wrapper {
    padding: 10px 20px;
    .list-wrapper {
      .list-item {
        padding: 10px;
        border: 1px solid #f5f5f5;
        margin-top: 5px;
      }
    }
  }
</style>