// 防抖
const debounce = (fn, delay) => {
  let timer = null;
  return (...args) => {
    console.log(args);
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  }
}

// 节流
const throttle = (fn, delay) => {
  let flag = true;
  return (...args) => {
    if (!flag) return;
    flag = false;
    fn.apply(this, args);
    setTimeout(() => {
      flag = true;
    }, delay)
  }
}

// function test(name) {
//   console.log(name)
// }
// throttle(test, 3000)('victor');

// 深度clone
const clone = (parent) => {
  const isType = (obj, type) => {
    if (typeof obj !== 'object') return false;
    const typeStr  = Object.prototype.toString.call(obj);
    let flag;
    switch(type) {
      case 'Array':
        flag = typeStr === '[object Array]';
        break;
      case 'Date':
        flag = typeStr === '[object Date]';
        break;
      case 'RegExp':
        flag = typeStr === '[object RegExp]';
        break;
      default:
        flag = false;
    }
    return flag;
  }

  //  处理正则
  const getRegExp = reg => {
    let flags = '';
    if (reg.global) flags += 'g';
    if (reg.ignoreCase) flags += 'i';
    if (reg.multiline) flags += 'm';
    return flags;
  }

  const parents = [];
  const children = [];

  const _clone = (parent) => {
    if (parent === null) return null;
    if (typeof parent !== 'object') return parent;
    let child, proto;
    if (isType(parent, 'Array')) {
      console.log('克隆数组')
      child = [];
    } else if (isType(parent, 'RegExp')) {
      console.log('克隆正则表达式')
      child = new RegExp(parent.source, getRegExp(parent));
      if (parent.lastIndex) child.lastIndex = parent.lastIndex;
    } else if (isType(parent, 'Date')) {
      console.log('克隆日期')
      child = new Date(parent.getTime());
    } else {
      console.log('克隆普通对象')
      // 处理对象原型
      proto = Object.getPrototypeOf(parent);
      child = Object.create(proto);
    }

    // 处理循环引用
    const index = parents.indexOf(parent);
    if (index !== -1) {
      // 如果父数组存在本对象，说明之前已经被引用过，直接返回此对象
      return children[index];
    }
    parents.push(parent);
    children.push(child);

    for (let key in parent) {
      console.log('循环遍历key', key)
      child[key] = _clone(parent[key]);
    }

    return child;
  }

  return _clone(parent);
}

// const result = clone([1,2,3]);
// console.log(result)

// 模拟instanceof
const instanceOf = (left, right) => {
  let proto = right.prototype; // 取 右边 的
  left = left.__proto__;   // 取隐氏原型
  while(true) {
    if (left === null) return false;
    if (proto === left) return true;
    left = left.__proto__;
  }
}

/**
 * 模拟new
 * 1. 创建一个全新的对象
 * 2. 它使this指向新对象
 * 3. 通过new创建的每个对象将最终被 prototype 连接到这个函数的prototype对象上
 * 4. 如果函数没有返回对象类型Object（包含Function，Array，Date，RegExp，Error），那么new表达式中的函数调用将返回改对象引用
 * 例子：myNew(class, arg1, arg2)
 */
const myNew = () => {
  const obj = new Object();
  // 取出实例对象
  const Constructor = Array.shift.call(arguments)
  obj.__proto__ = Constructor.prototype;
  // 执行构造函数应用到新对象上
  const ret = Constructor.apply(obj, arguments);
  return typeof ret === 'object' ? ret : obj;
}

/**
 * 实现call函数
 * 1. 将函数设为对象的属性
 * 2. 执行&删除这个函数
 * 3. 指定this到函数并传入给定参数执行函数
 * 4. 如果不传入参数，默认指向为window
 */
Function.prototype.myCall = function(context) {
  context.fn = this;
  let args = [];
  for (let i = 1; i < arguments.length; i++) {
    args.push(arguments[i]);
  }
  let result = context.fn(...args);
  delete context.fn;
  return result;
}

// 模拟apply
Function.prototype.myApply = function(context, arr) {
  context = Object(context) || window;
  context.fn = this;

  let result;
  if (!Array.isArray(arr)) {
    result = context.fn()
  } else {
    result = context.fn(...arr)
  }

  delete context.fn;
  return result;
}

// function callTest(name) {
//   console.log(this.say + '  ' + name);
// }
// callTest.myApply({ say: 'welcome' }, ['ms.js'])

if (!Function.prototype.bind)  {
  Function.prototype.bind = function(oThis) {
    if (typeof this !== 'function') {
      throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
    }

    var aArgs = Array.prototype.slice.call(arguments, 1);
    var fToBind = this;
    var fNOP = function() {};
    var fBound = function() {
      //  this instanceof fBound === true时，说明返回的fBound被当做new的构造函数调用
      return fToBind.apply(this instanceof fBound
        ? this : oThis,
        aArgs.concat(Array.prototype.slice.call(arguments)));
    }

    // 维护原型关系
    if (this.prototype) {
      // Function.prototype doesn't have a prototype property
      fNOP.prototype = this.prototype;
    }
    // 下⾏的代码使fBound.prototype是fNOP的实例,因此返回的fBound若作为new的构造函数,
    // new⽣成的新对象作为this传⼊fBound,新对象的__proto__就是fNOP的实例
    fBound.prototype = new fNOP();

    return fBound;
  }
}

// 模拟Object.create
const create = function(proto) {
  function F() {}
  F.prototype = proto;

  return new F();
}


// 实现继承
const Parent = function(name) {
  this.parent = name;
}
Parent.prototype.say = function() {
  console.log(`${this.parent}: 很高兴认识你`)
}

function Child(name, parent) {
  // 将父类的构造函数绑定在子类上
  Parent.call(this, parent);
  this.child = name;
}
/**
 * 1. 这一步不用Child.prototype = Parent.prototype的原因是怕共享内存，修改父类原型对象就会影响子类
 * 2. 不用Child.prototype = new Parent()的原因是会调用2次父类的构造方法（另一次是call），会存在一份多余的父类实例属性
 * 3. Object.create是创建了父类原型的副本，与父类原型完全隔离
 */
Child.prototype = Object.create(Parent.prototype);
Child.prototype.say = function() {
  console.log(`${this.parent}, 你好，我是你的继承者, 我的名字叫${this.child}`);
}

// 将子类的构造函数指向子类本身
Child.prototype.constructor = Child;

const parent = new Parent('父类');
parent.say();

const child = new Child('子类', '父类');
console.log(child instanceof Child);
child.say();