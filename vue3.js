// 分支切换与cleanup (有死循环！！！下一篇处理) 清除遗留的副作用函数
const data = {
  name: "任务1",
  type: "job",
  flag: true,
}
let activeEffect;
// 存储副作用函数的桶
// const bucket = new Set();
// 桶
const bucket = new WeakMap();
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
  effects && effects.forEach(fn => fn());
  // bucket.forEach(fn => fn())
  // return true
}
// 清除遗留的副作用函数
function cleanup(effectFn) {
  console.log(effectFn.deps.length)
  for (let i = 0;i < effectFn.deps.length;i++) {
    const deps = effectFn.deps[i];
    console.log('111')
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
// console.log(bucket)
// console.log(data.name)

// 注册副作用函数
function effect(fn) {
  // 此时每次修改值都会重新执行这个副作用函数
  const effectFn = () => {
    // 副作用函数每次触发之前先把所有依赖清掉
    cleanup(effectFn);
    activeEffect = effectFn;
    fn()
  }
  effectFn.deps = []
  effectFn()
}
effect(() => {
  const app = document.querySelector("#app");
  console.log('重新渲染了', bucket)
  app.innerHTML = obj.flag ? obj.name : '-';
});
setTimeout(() => {
  obj.flag = false;
  obj.name = '22222';
}, 2000)


setTimeout(() => {
  obj.name = '3333'
}, 4000)




