// watch
const data = {
  name: "任务1",
  type: "job",
  flag: true,
  num: 2,
  num1: 1
}
let activeEffect;
// 存储副作用函数的桶
// 桶
const bucket = new WeakMap();
// 存储当前执行副作用函数的栈
const effectStack = []
// 任务队列
let jobQueue = new Set();
// 定义一个微任务
const p = Promise.resolve();
let isFlushing = false;
function flushJob () {
  if (isFlushing) return;
  isFlushing = true
  p.then(() => {
    jobQueue.forEach(job => job())
  }).finally(() => {
    isFlushing = false
  })
}

function track(target, key) {
  if (!activeEffect) return target[key];
  // 根据target从bucket取出 depsMap
  let depsMap = bucket.get(target);
  // 如果没有depsMap 创建一个map并与target关联
  if (!depsMap) {
    bucket.set(target, (depsMap = new Map()))
  }
  let deps = depsMap.get(key);
  if (!deps) {
    depsMap.set(key, (deps = new Set()))
  }
  deps.add(activeEffect);
  activeEffect.deps.push(deps);
}
function trigger(target, key) {
  const depsMap = bucket.get(target);
  if (!depsMap) return;
  const effects = depsMap.get(key);
  if (key === "type") {
    console.log(effects)
  }
  const effectToRun = new Set();
  effects && effects.forEach(effectFn => {
    if (effectFn !== activeEffect) {
      effectToRun.add(effectFn)
    }
  });
  effectToRun.forEach(effectFn => {
    // 判断是否有scheduler属性，如果有则执行scheduler属性的函数，否则执行effectFn
    if (effectFn.options.scheduler) {
      effectFn.options.scheduler(effectFn)
    } else {
      effectFn()
    }
  })
}
function cleanup(effectFn) {
  // !!!!
  for (let i = 0;i < effectFn.deps.length;i++) {
    const deps = effectFn.deps[i];
    deps.delete(effectFn)
  }
  // 重置依赖（储存这个副作用函数的依赖集合的集合）数组
  effectFn.deps.length = 0;
}


const obj = new Proxy(data, {
  get(target, key) {
    console.log('get', target, key)
    track(target, key)
    return target[key];
  },
  set(target, key, newValue, receiver) {
    console.log('set')
    target[key] = newValue;
    trigger(target, key)
  }
});

// 注册副作用函数
function effect(fn, options = {}) {
  const effectFn = () => {
    cleanup(effectFn);
    activeEffect = effectFn;
    effectStack.push(effectFn)
    const res = fn();
    effectStack.pop()
    activeEffect = effectStack[effectStack.length - 1];
    return res;
  }
  effectFn.options = options;
  effectFn.deps = [];
  // 如果有lazy属性则不执行副作用函数，只返回副作用函数，因为没有执行该副作用函数所以track并没有进行依赖收集，
  // 所以只要是不手动触发就不会触发
  if (!options.lazy) {
    effectFn()
  }
  return effectFn;
}

// watch 是当响应式数据发生改变时 触发回调函数执行，前面 scheduler 就是相当于一个回调函数
function watch(source, cb) {
  let getter;
  if (typeof source === "function") {
    getter = source;
  } else {
    getter = () => traverse(source)
  }
  // 定义新值和旧值
  let oldValue, newValue;
  const effectFn = effect(() => getter(), {
    lazy: true,
    scheduler() {
      newValue = effectFn();
      console.log("scheduler 执行")
      cb(oldValue, newValue);
      oldValue = newValue;
    }
  });
  // 第一次旧值就是新值
  oldValue = effectFn();
}
function traverse(value, seen = new Set()) {
  if (typeof value !== "object" || value === null || seen.has(value)) return;
  seen.add(value)
  for(let k in value) {
    traverse(value[k], seen)
  }
  return value;
}
// watch(obj, () => {
//   console.log('watch 监听 obj.num 变了', obj.num)
// })

watch(() => obj.num, (oldVal, newVal) => {
  console.log('watch 监听 obj.num 变了', obj.num, oldVal, newVal)
})

setTimeout(() => {
  obj.num++
}, 2000)


console.log('执行结束', obj.num)



