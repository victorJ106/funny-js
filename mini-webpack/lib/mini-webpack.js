const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const types = require('@babel/types');
const generate = require('@babel/generator').default;
const ejs = require('ejs');

const EXPORT_DEFAULT_FUN = `
__webpack_require__.d(__webpack_exports__, {
  'default': () => (__WEBPACK_DEFAULT_EXPORT__)
});\n
`;

const ESMODULE_TAG_FUN = `
__webpack_require__.r(__webpack_exports__);\n
`;

// 读取配置文件
const webpackConfig = require('../webpack.config');

function parseFile(file) {
  const fileContent = fs.readFileSync(file, 'utf-8');
  // 转换ast语法树
  const ast = parser.parse(fileContent, { sourceType: 'module' });
  let importFilePath = '';
  // import 导入的变量名字
  let importVarName = ''; 
  let webpackImportVarName = ''; 
  let hasExport = false;

  traverse(ast, {
    ImportDeclaration(p) {
      console.log(p.node);
      // 获取import的文件
      const importFile = p.node.source.value;
      importVarName = p.node.specifiers[0].local.name;
      // import文件路径
      importFilePath = path.join(path.dirname(file), importFile);
      importFilePath = `./${importFilePath}.js`;
      // webpack的的import名称
      webpackImportVarName = `__${path.basename(importFile)}__WEBPACK_IMPORTED_MODULE_0__`;

      // 构建一个变量定义的ast节点
      // 转换后代码是
      // var __helloworld__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("./src/helloworld.js");
      const variableDeclaration = types.variableDeclaration('var', [
        types.variableDeclarator(
          types.identifier(webpackImportVarName),
          types.callExpression(types.identifier('__webpack_require__'), [
            types.stringLiteral(importFilePath),
          ])
        ),
      ]);

      //将当前节点替换为变量定义节点
      p.replaceWith(variableDeclaration);
    },
    CallExpression(p) {
      // 如果调用的是import进来的函数
      if (p.node.callee.name === importVarName) {
        // 把import模块名变成webpack的的名称
        p.node.callee.name = webpackImportVarName + '.default';
      }
    },
    Identifier(p) {
      // 如果调用的是import进来的变量
      if (p.node.name === importVarName) {
        // 将导入进来的变量名变成webpack的的名称
        p.node.name = webpackImportVarName + '.default';
      }
    },
    ExportDeclaration(p) {
      hasExport = true;  // 标记是否有export

      const variableDeclaration = types.variableDeclaration('const', [
        types.variableDeclarator(
          types.identifier('__WEBPACK_DEFAULT_EXPORT__'),
          types.identifier(p.node.declaration.name)
        ),
      ]);

      // 将当前节点替换为webpack自定义变量
      p.replaceWith(variableDeclaration);
    }
  })

  // 生成新代码
  let newCode = generate(ast).code;
  console.log(newCode);

  if (hasExport) {
    newCode = `${EXPORT_DEFAULT_FUN} ${newCode}`;
  }

  newCode = `${ESMODULE_TAG_FUN} ${newCode}`;

  return {
    file,
    dependencies: [importFilePath],
    code: newCode,
  }
}

// 使用ejs将上面解析好的ast传递给模板
// 返回最终生成的代码
function generateCode(allAst, entry) {
  const tpl = fs.readFileSync(
    path.join(__dirname, './template.js'),
    'utf-8'
  );

  // 利用ejs模板生成最终的代码
  const code = ejs.render(tpl, {
    __TO_REPLACE_WEBPACK_MODULES__: allAst,
    __TO_REPLACE_WEBPACK_ENTRY__: entry,
  });

  return code;
}

function parseFiles(entry) {
  const entryRes = parseFile(entry);
  const results = [entryRes];

  for (const res of results) {
    const dependencies = res.dependencies;
    dependencies.forEach(dep => {
      if (dep) {
        const obj = parseFile(dep);
        results.push(obj);
      }
    });
  }

  return results;
}

const { entry, output } = webpackConfig;

const allAst = parseFiles(entry);
console.log(allAst);
const resultCode = generateCode(allAst, entry);

fs.writeFileSync(path.join(output.path, output.filename), resultCode);