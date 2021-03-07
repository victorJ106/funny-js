const  MyPromise =(function()  {
  // 和reject不同的是resolve需要尝试展开thenable对象
  function mResolve(value) {
    if (this === value) {
      // 主要防止下面这种情况
      // let y = new Promise(resolve => setTimeout(resolve(y)))
      throw new TypeError('Cycle for promise')
    }

    // 根据规范2.32以及2.33对对象或者函数的尝试展开
    // 保证s6之前的polyfill 也能和es6的原生promise混用
    console.log('1===', value)
    if (value !== null && 
      (typeof value === 'object' || typeof value === 'function')) {
      // 这里记录这次then的值同时要被try包裹
      // 主要原因是 then 可能是一个getter，也就是说
      // 1. value.then 可能报错
      // 2. value.then 可能产生副作用（例如多次 执行坑你结果不同）
      const then = value.then;
      console.log('2===then:', then)
      // 另一方面，由于无法保证 then 确实会像预期的那样只调用一个 onFullfilled / onRejected
      // 所以增加了一个flag来防止resolveOrReject被多次调用
      let thenIsCalled = false;
      try {
        if (typeof then === 'function') {
          // 是 thenable 那么尝试展开
          //并且在该thenable状态改变之前this对象的状态不变
          then.bind(value)(
            // onFullfilled
            function(value2) {
              if (thenIsCalled) return;
              thenIsCalled = true;
              mResolve.bind(this, value2)();
            }.bind(this),

            // onRejected
            function(reason2) {
              if (thenIsCalled) return;
              thenIsCalled = true;
              resolveOrReject.call(this, 'rejected', reason2);
            }.bind(this)
          )
        } else {
          // 拥有then 但是then不是一个函数，所以也不是thennable
          resolveOrReject.call(this, 'resolved', value);
        }
      } catch(e) {
        if (thenIsCalled) return;
        thenIsCalled = true;
        resolveOrReject.call(this, 'rejected', e);
      }
    } else {
      // 基本类型直接返回
      resolveOrReject.call(this, 'resolved', value);
    }
  }

  function resolveOrReject(status, data) {
    if (this.status !== 'pending') return;
    this.status = status;
    this.data = data;
    if (status === 'resolved') {
      console.log('3===resolvelist:', this.resolveList)
      for (let i = 0; i < this.resolveList.length; i++) {
        this.resolveList[i]();
      }
    } else {
      for (let i = 0; i < this.rejectList.length; i++) {
        this.rejectList[i]();
      }
    }
  }

  function Promise(excecutor) {
    if (!(this instanceof Promise)) {
      throw Error('Promise can not be called without new!');
    }

    if (typeof excecutor !== 'function') {
      throw TypeError('Promise resolve ' + excecutor + ' must be a function!')
    }

    this.status = 'pending';
    this.resolveList = [];
    this.rejectList = [];

    try {
      excecutor(mResolve.bind(this), resolveOrReject.bind(this, 'rejected'));
    } catch(e) {
      resolveOrReject.call(this, 'rejected', e);
    }
  }

  Promise.prototype.then = function(onFullfilled, onRejected) {
    // 返回值穿透以及错误穿透，注意错误穿透用的是throw而不是return，否则的话
    // 这个then返回的promise状态将变成resolved即接下来的then中的onFullfilled
    // 会被调用，然而我们想要调用的是onRejected
    if (typeof onFullfilled !== 'function') {
      onFullfilled = function(data) {
        return data;
      }
    }

    if (typeof onRejected !== 'function') {
      onRejected = function(reason) {
        throw reason;
      }
    }

    function excecutor(resolve, reject) {
      setTimeout(function() {
        try {
          // 拿到对应的handle函数处理this.data
          // 并以此为依据解析这个新的Promise
          const value = this.status === 'resolved' 
            ? onFullfilled(this.data)
            : onRejected(this.data);
          resolve(value);
        } catch(e) {
          reject(e);
        }
      }.bind(this));
    }

    // then 接受两个函数返回一个新的promise
    // then 自身的执行永远异步与onFullfilled/onRejected的执行
    if (this.status !== 'pending') {
      return new Promise(excecutor.bind(this));
    } else {
      // pending
      return new Promise(function(resolve, reject) {
        this.resolveList.push(excecutor.bind(this, resolve, reject));
        this.rejectList.push(excecutor.bind(this, resolve, reject));
      }.bind(this));
    }
  }

  Promise.prototype.deferred = Promise.defer = function() {
    const df = {};
    df.promise = new Promise(function(resolve, reject) {
      df.resolve = resolve;
      df.reject = reject;
    })
    return df;
  }

  if (typeof module !== 'undefined') {
    module.exports = Promise;
  }

  return Promise;
})()

MyPromise.all = function(promises) {
  return new MyPromise((resolve, reject) => {
    const result = [];
    let count = 0;
    for (let i = 0; i < promises.length; i++) {
      promises[i].then(value => {
        count++;
        result[i] = value;
        if (count === promises.length) resolve(result);
      }, reject);
    }
  })
}

MyPromise.race = function(promises) {
  return new MyPromise((resolve, reject) => {
    for (let i = 0; i < promises.length; i++) {
      promises[i].then(resolve, reject);
    }
  })
}

function test() {
  return new MyPromise((resolve, reject) => {
    setTimeout(() => {
      resolve('aaaa')
    }, 3000)
  })
}

test().then(res => {
  console.log('result:==', res);
})