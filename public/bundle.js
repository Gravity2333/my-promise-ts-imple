/******/ // The require scope
/******/ var __webpack_require__ = {};
/******/ 
/************************************************************************/
/******/ /* webpack/runtime/define property getters */
/******/ (() => {
/******/ 	// define getter functions for harmony exports
/******/ 	__webpack_require__.d = (exports, definition) => {
/******/ 		for(var key in definition) {
/******/ 			if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 				Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 			}
/******/ 		}
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/hasOwnProperty shorthand */
/******/ (() => {
/******/ 	__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ })();
/******/ 
/******/ /* webpack/runtime/make namespace object */
/******/ (() => {
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = (exports) => {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/ })();
/******/ 
/************************************************************************/
var __webpack_exports__ = {};
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ MyPromise)
/* harmony export */ });
/** Promise状态
 *  FulFilled 成功
 *  Rejected 失败
 *  Pending 未决策
 */
var MyPromiseState;
(function (MyPromiseState) {
    MyPromiseState["FULFILLED"] = "fulfilled";
    MyPromiseState["REJECTED"] = "rejected";
    MyPromiseState["PENDING"] = "pending";
})(MyPromiseState || (MyPromiseState = {}));
/** 把任务推入微任务队列，如果没有queueMicrotask， 使用settimeout 兼容运行环境 */
const pushToMicroTask = typeof queueMicrotask === "function" ? queueMicrotask : setTimeout;
/**
 * 实现一个Promise对象
 */
class MyPromise {
    // Promise状态
    state = MyPromiseState.PENDING;
    // 成功回调list 在promise成功后调用
    onFulfilledTasks = [];
    // 失败回调list 在promise失败后调用
    onRejectedTasks = [];
    // 值
    value;
    // 构造函数
    constructor(executor) {
        try {
            // 执行执行器，传入resolvePromise / rejectPromise
            executor(this._resolvePromise.bind(this), this._rejectPromise.bind(this));
        }
        catch (e) {
            /** 这里需要用try ... catch包一下, 执行器执行的过程中，如果出现异常，直接reject掉promise */
            this._rejectPromise(e);
        }
    }
    /** 判断当前Promise是否被决策 */
    _isPromiseDecided() {
        return this.state !== MyPromiseState.PENDING;
    }
    /** 用来resolve当前Promise */
    _resolvePromise(value) {
        /** 只有在Promise没有决策的情况下才能调用 */
        if (!this._isPromiseDecided()) {
            if (MyPromise._isThenable(value)) {
                MyPromise.resolve(value).then(this._resolvePromise.bind(this), this._rejectPromise.bind(this));
            }
            else {
                // 修改状态
                this.state = MyPromiseState.FULFILLED;
                // 设置值
                this.value = value;
                // 检查 onFulfilledTasks 是否有注册的then任务，如果有就执行
                this.onFulfilledTasks.forEach((task) => task());
            }
        }
    }
    /** 用来拒拒当前Promise */
    _rejectPromise(reason) {
        /** 只有在Promise没有决策的情况下才能调用 */
        if (!this._isPromiseDecided()) {
            // 修改状态
            this.state = MyPromiseState.REJECTED;
            // 设置值
            this.value = reason;
            // 检查 onRejectedTasks 是否有注册的then任务，如果有就执行
            this.onRejectedTasks.forEach((task) => task());
        }
    }
    /** duck检测，兼容thenable */
    static _isThenable(thenable) {
        if (typeof thenable === "object" || typeof thenable === "function") {
            if (typeof thenable?.then === "function") {
                return true;
            }
        }
        return false;
    }
    /**  处理thenable */
    static _handleThenable(thenable, onFulfilled, onRejected) {
        if (this._isThenable(thenable)) {
            thenable.then((value) => {
                this._handleThenable(value, onFulfilled, onRejected);
            }, (reason) => {
                onRejected(reason);
            });
        }
        else {
            onFulfilled(thenable);
        }
    }
    /** then方法
     *  1. 根据Promise的状态，决定调用哪个回调
     *  2. 根据回调的返回结果，确定then函数的返回结果
     */
    then(onFulfilled = (value) => value, onRejected = (reason) => {
        // 把异常抛出去 方便后面catch接收
        throw reason;
    }) {
        // then返回的一定是个Promise
        return new MyPromise((resolve, reject) => {
            /** 在微任务中执行then任务 */
            const _runThenTask = () => {
                pushToMicroTask(() => {
                    try {
                        let callbackResult;
                        /** 根据state 执行对应的回调 */
                        if (this.state === MyPromiseState.FULFILLED) {
                            callbackResult = onFulfilled(this.value);
                        }
                        else if (this.state === MyPromiseState.REJECTED) {
                            callbackResult = onRejected(this.value);
                        }
                        else {
                            return;
                        }
                        /** 需要判断，返回结果不能是当前Promise本身，否则会出现死循环 */
                        if (callbackResult === this) {
                            throw new Error("then方法不能返回本身的MyPromise");
                        }
                        if (MyPromise._isThenable(callbackResult)) {
                            // 鸭子检测 查看是不是thenable
                            MyPromise._handleThenable(callbackResult, resolve, reject);
                        }
                        else if (callbackResult instanceof MyPromise) {
                            callbackResult.then(resolve, reject);
                        }
                        else {
                            // 直接resolve
                            resolve(callbackResult);
                        }
                    }
                    catch (e) {
                        reject(e);
                    }
                });
            };
            // 把resolve和reject函数交付
            if (this._isPromiseDecided()) {
                // 已经决策了，直接执行任务
                _runThenTask();
            }
            else {
                // 还没决策，把任务放到任务队列中
                this.onFulfilledTasks.push(_runThenTask.bind(this));
                this.onRejectedTasks.push(_runThenTask.bind(this));
            }
        });
    }
    /** catch 就是相当于代理了then*/
    catch(catchHandler) {
        this.then((value) => value, catchHandler);
    }
    /** finally 透传递 */
    finally(finallyHandler) {
        this.then(finallyHandler, finallyHandler);
    }
    /** resolve方法 返回一个成功的Resolve 或者根据thenable转换 */
    static resolve(thenable) {
        return new MyPromise((resolve, reject) => {
            this._handleThenable(thenable, resolve, reject);
        });
    }
    /** 返回一个失败的promise */
    static reject(reason) {
        return new MyPromise((resolve, reject) => {
            reject(reason);
        });
    }
    /** all 所有都成功 返回valueList */
    static all(promises) {
        const valueList = [];
        let successCnt = 0;
        return new MyPromise((resolve, rehject) => {
            for (let i = 0; i < promises.length; i++) {
                const currengPromise = promises[i];
                currengPromise.then((value) => {
                    valueList[i] = value;
                    if (++successCnt === promises.length) {
                        resolve(valueList);
                    }
                }, (reason) => {
                    this.reject(reason);
                });
            }
        });
    }
    /** 所有都决定了 注意返回值 {status,value} */
    static allSettled(promises) {
        const allSettledReturns = [];
        for (let i = 0; i < promises.length; i++) {
            const currentPromise = promises[i];
            currentPromise.then((value) => {
                allSettledReturns[i] = {
                    status: MyPromiseState.FULFILLED,
                    value,
                };
            }, (reason) => {
                allSettledReturns[i] = {
                    status: MyPromiseState.REJECTED,
                    value: reason,
                };
            });
        }
    }
    /** rece 返回第一个 */
    static race(promises) {
        return new MyPromise((resolve, reject) => {
            for (const promise of promises) {
                promise.then(resolve, reject);
            }
        });
    }
    /** any 有一个成功 */
    static any(promises) {
        let rejectedCnt = 0;
        return new MyPromise((resolve, reject) => {
            for (const promise of promises) {
                promise.then((value) => {
                    resolve(value);
                }, (reason) => {
                    if (++rejectedCnt === promises.length) {
                        reject(new AggregateError("All promises were rejected"));
                    }
                });
            }
        });
    }
}

var __webpack_exports__default = __webpack_exports__["default"];
export { __webpack_exports__default as default };
