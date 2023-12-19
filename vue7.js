// 解决副作用函数是一个自增会导致堆栈溢出，如果副作用函数正在执行就不进行调用了
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
    effectStack.push(effectFn)
    fn();
    effectStack.pop()
    activeEffect = effectStack[effectStack.length - 1];
  }
  effectFn.deps = []
  effectFn()
}
// 在这种情况下，我们希望当修改 obj.name 时会触发 effectFn1 执行。由于 effectFn2 嵌套在 effectFn1 里，所以会间接触发 effectFn2 执行
// 而当修改 obj.type 时，只会触发 effectFn2 执行。
effect(() => {
  // const app = document.querySelector("#app");
  console.log('重新渲染了一层', bucket)
  obj.num++
});

setTimeout(() => {
  obj.num++
  obj.num++
}, 2000)



