# 手写一个 mini-webapck

* `webpack` 最基本的功能其实是将 `js` 的模块化，`import` 和 `require` 之类的转换为浏览器能认识的普通函数调用语句
* 要进行代码的转换，需要先对代码进行解析
* 常用的解析方法是 `ast —— 抽象语法树`
* 利用 `babel` 可以将代码转换为 `ast` 
* 利用 `@babel/parser` `@babel/traverse` `@babel/types` `@babel/generator` 解析代码，修改代码然后生成我们想要的代码
  
* [bebel官方文档](https://babel.dev/docs/en/)
* [webpack官方文档](https://webpack.docschina.org/concepts/)
