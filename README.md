# my-sample-history 
## 手动实现一个简单的history
包含 BrowserHistory 和 HashHistroy 
实现了两种模式的监听路由变动，可以在页面不刷新的情况下改变并且监听路由，是实现前端路由的基本!

相比于react-router 官方的history-dev 实现上稍有不同但是功能类似，去掉了类似block等拦截功能，简化了代码并且加入了注释，更方便了解源码运行原理

#### 使用 
npm install
npm run build

详见public/demo

#### browserHistroy
```javascript
        import { createBrowserHistory } from "../bundle.js";
        const history = createBrowserHistory({})
        // 初始化路径
        history.push('/')

        // 绑定按钮
        const homeBtn = document.getElementById("homeBtn")
        const aboutBtn = document.getElementById("aboutBtn")

        // 注册按钮点击事件，跳转
        homeBtn.onclick = () => {
            history.push('/home')
        }

        aboutBtn.onclick = () => {
            history.push({
                pathname: '/about'
            })
        }


        // 注册监听，改变渲染
        history.listen(({ action, location }) => {
            console.log(action, location)
            switch (location.pathname) {
                case '/home':
                    contentArea.innerHTML = `<h1>HOME PAGE</h1>`
                    return;
                case '/about':
                    contentArea.innerHTML = `<h1>About PAGE</h1>`
                    return;
                case '/':
                    contentArea.innerHTML = `<h1>Welcome 😊</h1>`
                    return;
            }
        })
```


# my-promise-ts-imple
