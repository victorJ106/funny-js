const fs = require('fs');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

// 读取配置文件
const webpackConfig = require('../webpack.config');
const fileContent = fs.readFileSync(webpackConfig.entry, 'utf-8');
// 转换ast语法树
const ast = parser.parse(fileContent, { sourceType: 'module' });

traverse(ast, {
  ImportDeclaration(path) {
    console.log(path.node);
  }
})