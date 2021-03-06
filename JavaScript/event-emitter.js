// event bus 事件的订阅与发布
class EventEmitter {
  constructor() {
    // 存储事件/回调键值对
    this._events = this._events || new Map();
    // 监听最大数
    this._maxListenners = this._maxListenners || 10;
  }
}

// 触发事件
EventEmitter.prototype.emit = function(type, ...args) {
  if (!type) return false;
  let handler = this._events.get(type);
  if (!handler) return false;
  // 判断是否有多个事件在缓存中，并循环执行事件
  if (Array.isArray(handler)) {
    for (let i = 0; i < handler.length; i++) {
      callFn(handler[i]);
    }
  } else {
    callFn(handler);
  }

  function callFn(fn) {
    if (args.length > 0) {
      fn.apply(this, args);
    } else {
      fn.call(this);
    }
  }
  return true;
}

// 监听事件
EventEmitter.prototype.on = function(type, fn) {
  if (!type || !fn) return false;
  const handler = this._events.get(type);
  if (!handler) {
    this._events.set(type, fn);
  } else if (Array.isArray(handler)) {
    handler.push(fn);
  } else {
    this._events.set(type, [handler, fn]);
  }
  return true;
}

// 取消监听
EventEmitter.prototype.off = function(type, fn) {
  const handler = this._events.get(type);
  if (!handler) return;
  if (handler && typeof handler === 'function') {
    this._events.delete(type);
  } else {
    let position;
    for (let i = 0; i < handler.length; i++) {
      if (handler[i] === fn) {
        position = i;
      } 
    }

    if (position >= 0) {
      handler.splice(position, 1);
      // 如果清除后只剩一个，取消数组形式，以函数形式保存
      if (handler.length === 1) {
        this._events.set(type, handler[0]);
      }
    }
  }
}

const eventBus = new EventEmitter();
eventBus.on('test', (name) => {
  console.log(`hello ${name}`);
})

setTimeout(() => {
  eventBus.emit('test', 'ceshi');
}, 5000);