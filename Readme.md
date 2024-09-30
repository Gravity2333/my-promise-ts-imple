# 一个基于 ts 实现的 Promise

## 下载

npm install my-promise-ts-imple

## 使用方法

```javascript
import MyPromise from "my-promise-ts-imple";

new MyPromise()
  .then(
    (val) => {
      // TODO OnFulfiilled Impl
    },
    (reason) => {
      // TODO OnRejected Imple
    }
  )
  .catch((err) => {
    // TODO handle Error
  })
  .finally(() => {
    // TODO handle Finally
  });
```
