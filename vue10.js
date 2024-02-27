// lazy
const data = {
  name: "任务1",
  type: "job",
  flag: true,
  num: 0
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
    fn();
    effectStack.pop()
    activeEffect = effectStack[effectStack.length - 1];
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
// 配置lazy属性后通过effect 返回值拿到副作用函数，然后手动执行
// lazy 是在注册副作用函数时不执行副作用函数，而是在手动执行，是在注册时就产生效果
// scheduler 是在副作用函数触发时直接执行的函数并且参数是副作用函数
const fn = effect(() => {
  console.log('重新渲染了一层', obj.num)
},{
  lazy: true
});


obj.num++
obj.num++

setTimeout(() => {
  fn()
}, 3000)

console.log('执行结束')



