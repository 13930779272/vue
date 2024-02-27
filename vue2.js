const data = {
  name: "任务1",
  type: "job",
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
  deps.add(activeEffect)
}
// { weakMap
//   obj: { map
//     name: [] set
//   }
// }
function trigger(target, key) {
  const depsMap = bucket.get(target);
  if (!depsMap) return;
  const effects = depsMap.get(key)
  effects && effects.forEach(fn => fn());
  // bucket.forEach(fn => fn())
  // return true
}


const obj = new Proxy(data, {
  get(target, key) {
    console.log('get', target, key)
    track(target, key)
    // console.log(activeEffect)
    // if (!activeEffect) return target[key];
    // // 根据target从bucket取出 depsMap
    // let depsMap = bucket.get(target);
    // // 如果没有depsMap 创建一个map并与target关联
    // if (!depsMap) {
    //   bucket.set(target, (depsMap = new Map()))
    // }
    // let deps = depsMap.get(key);
    // if (!deps) {
    //   depsMap.set(key, (deps = new Set()))
    // }
    // deps.add(activeEffect)
    return target[key];
  },
  set(target, key, newValue, receiver) {
    console.log('set')
    target[key] = newValue;
    trigger(target, key)
    // const depsMap = bucket.get(target);
    // if (!depsMap) return;
    // const effects = depsMap.get(key)
    // effects && effects.forEach(fn => fn());
    // // bucket.forEach(fn => fn())
    // return true
  }
});
console.log(bucket)
// console.log(data.name)

// 注册副作用函数
function effect(fn) {
  activeEffect = fn;
  fn()
}
effect(() => {
  const app = document.querySelector("#app");
  console.log('重新渲染了')
  app.innerHTML = obj.name;
});
setTimeout(() => {
  obj.name = '22222'
}, 2000)

setTimeout(() => {
  obj.type = '33'
}, 2000)





