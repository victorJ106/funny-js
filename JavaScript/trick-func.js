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
