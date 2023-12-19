const data = {
  name: "任务1",
  type: "job",
}
let activeEffect;
// 存储副作用函数的桶
const bucket = new Set();

const obj = new Proxy(data, {
  get(target, key) {
    console.log('get', target, key)
    // console.log(activeEffect)
    if (activeEffect) {
      bucket.add(activeEffect)
    }
    return target[key]
  },
  set(target, key, newValue, receiver) {
    console.log('set')
    target[key] = newValue;
    bucket.forEach(fn => fn())
    return true
  }
});
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





