<template>
  <div class="main-wrapper">
    <h2>分片上传、断点续传示例</h2>
    <div ref="drag" class="drag-wrapper">
      <input type="file" name="file" @change="onFileChange">
    </div>
    <el-progress :stroke-width="20" :text-inside="true" :percentage="uploadProgress"
      style="margin: 10px 0;"></el-progress>
    <el-button @click="onUpload" type="primary">上传<i class="el-icon-loading"></i></el-button>
    <div class="upload-list-wrapper" :style="{'width': cubWidth + 'px'}">
      <div class="cube" v-for="chunk in chunks" :key="chunk.name">
        <div :class="{
        'uploading': chunk.percent > 0 && chunk.percent < 100,
        'success': chunk.percent === 100,
        'error': chunk.percent < 0
        }" :style="{height: chunk.percent + '%'}">
          <i class="el-icon-loading" v-if="chunk.percent > 0  && chunk.percent < 100"></i>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import SparkMd5 from 'spark-md5';

  const CHUNK_SIZE = 1*1024*1024;
  export default {
    name: 'upload',
    computed: {
      cubWidth() {
        return Math.ceil(Math.sqrt(this.chunks.length))*30;
      }
    },
    data() {
      return {
        file: null,
        uploadProgress: 50,
        chunks: [],
        hash: ''
      }
    },
    methods: {
      async onUpload() {
        if (!this.file) return;
        const hash = await this.calculateHashSample();
        this.hash = hash;
        const { data: { uploaded, uploadedList } } = await this.$http.post('/checkFile', {
          hash,
          type: this.file.name.split('.').pop()
        });
        if (uploaded) {
          this.$message.success('秒传成功');
          return;
        }
        const chunks = this.splitFileChunks();
        console.log('计算hash===', hash);
        this.chunks = chunks.map((chunk, index) => {
          const name = hash + '-' + index;
          return {
            hash,
            name,
            index,
            chunk: chunk.file,
            percent: uploadedList.indexOf(name) > -1 ? 100 : 0
          }
        })
        this.uploadChunks(uploadedList || []);
      },
      // 抽样计算文件hash
      async calculateHashSample() {
        // 根据文件内容加密抽取hash值，判断文件是否存在 
        // 如果文件过大，进行加密抽取hash值，会严重影响性能，所以进行抽样加密获取hash
        // 抽取文件开始和结束各2M
        // 中间区域每隔2M截取前中后各2个字节的数据
        return new Promise((resolve, reject) => {
          const spark = new SparkMd5.ArrayBuffer();
          const reader = new FileReader();

          const file = this.file;
          const size = file.size;
          const sampleSize = 2*1024*1024;
          let chunks = [file.slice(0, sampleSize)];

          let cur = sampleSize;
          while(cur < size) {
            if (cur + sampleSize >= size) {
              chunks.push(file.slice(cur, cur + sampleSize));
            } else {
              const mid = cur + sampleSize / 2;
              const end = cur + sampleSize;
              chunks.push(file.slice(cur, cur + 2));
              chunks.push(file.slice(mid, mid + 2));
              chunks.push(file.slice(end - 2, end));
            }
            cur += sampleSize;
          }
          reader.readAsArrayBuffer(new Blob(chunks));
          reader.onload = e => {
            spark.append(e.target.result);
            resolve(spark.end());
          }
        })
      },
      async uploadChunks(list) {
        const requests = this.chunks.filter(chunk => list.indexOf(chunk.name) === -1)
          .map((chunk, index) => {
            const form = new FormData();
            form.append('chunk', chunk.chunk);
            form.append('hash', chunk.hash)
            form.append('name', chunk.name)
            return { form, index: chunk.index, error: 0 };
          })
          // .map(({form, index}) => this.$http.post('/uploadFile', form, {
          //   onUploadProgress: progress => {
          //     console.log(progress)
          //     this.chunks[index].percent = Number(((progress.loaded/progress.total)*100).toFixed(2));
          //   }
          // }));
          // await Promise.all(requests);
          await this.sendRequest(requests);
          // await this.mergeRequest();
          this.$message.success('上传成功！');
      },
      // 并发控制，每次只发出3次请求
      async sendRequest(requests, limit = 3) {
        return new Promise((resolve, reject) => {
          const len = requests.length;
          let isStop = false;  // 是否停止请求
          let count = 0;
          const start = async () => {
            const task = requests.shift();
            if (!task || isStop) return;
            const { form, index, error } = task;
            try {
              await this.$http.post('/uploadFile', form, {
                onUploadProgress: progress => {
                  this.chunks[index].percent = Number(((progress.loaded/progress.total)*100).toFixed(2));
                }
              })

              if (count === len -1) {
                resolve();
              } else {
                count++;
                start();
              }
            } catch(err) {
              console.log(err);
              this.chunks[index].percent = -1;
              // 请求发生错误时，重新上传chunk
              // 最多连续三次请求错误，超出3次停止上传
              if (error < 3) {
                task.error++;
                requests.unshift(task);  // 把任务放回任务列表，重新开始任务
                start();
              } else {
                isStop = true;
                reject();
              }
            }
          }

          while (limit > 0) {
            start();
            limit--;
          }
        })
      },
      // 文件切片
      splitFileChunks() {
        let chunks = [];
        let sum = 0;
        while(sum < this.file.size) {
          chunks.push({
            index: sum,
            file: this.file.slice(sum, sum + CHUNK_SIZE)
          });
          sum += CHUNK_SIZE;
        }
        console.log('split chunks ', chunks)
        return chunks;
      },
      async mergeRequest() {
        const res = await this.$http.post('/mergeFile', {
          type: this.file.name.split('.').pop(),
          size: CHUNK_SIZE,
          hash: this.hash
        });
        console.log('合并文件成功', res);
      },
      //  绑定上传拖拽事件
      bindDragEvent() {
        const dragDom = this.$refs.drag;
        dragDom.addEventListener('dragover', (e) => {
          dragDom.style.borderColor =  'blue';
          e.preventDefault();
        })
        dragDom.addEventListener('dragleave', (e) => {
          dragDom.style.borderColor = '#eee';
          e.preventDefault();
        })
        dragDom.addEventListener('drop', (e) => {
          const files = e.dataTransfer.files;
          console.log(files)
          if (files &&  files.length > 0) {
            this.file = files[0];
          }
          dragDom.style.borderColor = '#eee';
          e.preventDefault();
        })
      },
      onFileChange(e) {
        console.log(e)
        const [file] = e.target.files;
        if (file) {
          this.file = file;
        }
      }
    },
    mounted() {
      this.bindDragEvent();
    }
  }
</script>

<style lang="scss" scoped>
  .main-wrapper {
    padding: 10px 20px;
    .drag-wrapper {
      height: 100px;
      border: 2px dashed #eee;
      line-height: 100px;
      text-align: center;
    }
    .upload-list-wrapper {
      margin-top: 20px;
      display: flex;
      flex-wrap: wrap;
      .cube {
        height: 30px;
        width: 30px;
        line-height: 30px;
        text-align: center;
        border: 1px solid #000;
        background: #ccc;
        .uploading  {
          background: #409EFF;
          color: #fff;
        }
        .success {
          background: #0dce0d;
        }
        .error {
          background: red;
        }
      }
    }
  }
</style>