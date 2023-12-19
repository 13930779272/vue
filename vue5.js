// 嵌套的effect与effect栈(嵌套之后会导致副作用函数执行错误)
const data = {
  name: "任务1",
  type: "job",
  flag: true,
}
let activeEffect;
// 存储副作用函数的桶
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
  const effectToRun = new Set(effects);
  effectToRun.forEach(effectFn => effectFn())
}
function cleanup(effectFn) {
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
// console.log(bucket)
// console.log(data.name)

// 注册副作用函数
function effect(fn) {
  // 此时每次修改值都会重新执行这个副作用函数
  const effectFn = () => {
    // 副作用函数每次触发之前先把所有依赖清掉
    // 每次副作用函数执行时，我们可以先把它从所有与之关联的依赖集合中删除
    // 断开副作用函数与响应式数据之间的联系
    // 当副作用函数执行完毕后，会重新建立联系，但在新的联系中不会包含遗留的副作用函数，所以，如果我们能做到每次副作用函数执行前，将其从相关联的依赖集合中移除，那么问题就迎刃而解了。
    cleanup(effectFn);
    activeEffect = effectFn;
    fn()
  }
  effectFn.deps = []
  effectFn()
}
effect(() => {
  const app = document.querySelector("#app");
  console.log('重新渲染了一层', bucket)
  effect(() => {
    console.log('重新渲染了二层', bucket)
    const temp = document.querySelector("#temp");
    temp.innerHTML = obj.type;
  });
  app.innerHTML = obj.name;
});

setTimeout(() => {
  obj.name = '3333'
}, 5000)




