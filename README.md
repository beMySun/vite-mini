
# Vite-mini

1. 利用浏览器自带的moduel import功能，来实现文件的加载
2. 支持import vue
  - 原理: 从node_module里面获取
  - 1. import xx from 'vue' 改造一下 变成 import xx from '/@modules/vue'
  - 2. koa拦截@module开头的请求，去node_module找
3. 支持.vue单文件组件(只有js和template, 解析.vue文件，把script拿出来)
4. 支持.css，我们可以看下vite怎么支持ts的，怎么热更新.
