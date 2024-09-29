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
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/** 实现一个Promise */
/** Promise状态枚举 */
var EMyPromiseState;
(function (EMyPromiseState) {
    /** 未决策状态 */
    EMyPromiseState["PENDING"] = "pending";
    /** 成功状态 */
    EMyPromiseState["FULFILLED"] = "fulfilled";
    /** 拒绝状态 */
    EMyPromiseState["REJECTED"] = "rejected";
})(EMyPromiseState || (EMyPromiseState = {}));
class MyPromise {
    /** 成功回调缓存 */
    onFulfilledCallbacks = [];
    /** 失败回调缓存 */
    onRejectedCallbacks = [];
    /** 状态 */
    state = EMyPromiseState.PENDING;
    /** value */
    value;
    /** 用来判断promise是否已经决策 */
    _isMyPrimiseDecided() {
        return this.state !== EMyPromiseState.PENDING;
    }
    /** 实现决策成功promise */
    _resolvePromiseImpl(value) {
        this.value = value;
        this.state = EMyPromiseState.FULFILLED;
        this.onFulfilledCallbacks.forEach((onFulfilledCallback) => {
            onFulfilledCallback();
        });
    }
    /** 实现决失败promise */
    _rejectPromiseImpl(reason) {
        /** 设置失败reason和状态 */
        this.value = reason;
        this.state = EMyPromiseState.REJECTED;
        /** 此时回调缓存可能有挂着的任务，执行*/
        this.onRejectedCallbacks.forEach((onRejectedCallback) => {
            onRejectedCallback();
        });
    }
    /** 用来决策成功promise */
    _resolvePromise(inputVal) {
        /** promise状态只可以变化一次 */
        if (!this._isMyPrimiseDecided()) {
            /** duck检测 */
            if (MyPromise._duckTest(inputVal)) {
                MyPromise.resolve(inputVal).then(this._resolvePromiseImpl, this._rejectPromiseImpl);
            }
            else {
                this._resolvePromiseImpl(inputVal);
            }
        }
    }
    /** 用来拒绝promise */
    _rejectPromise(reason) {
        /** promise状态只可以变化一次 */
        if (!this._isMyPrimiseDecided()) {
            this._rejectPromiseImpl(reason);
        }
    }
    /** ctor 穿入执行器函数 */
    constructor(executor) {
        try {
            /** 为了实现执行器内抛出异常自动拒绝 */
            executor(this._resolvePromise.bind(this), this._rejectPromise.bind(this));
        }
        catch (reason) {
            this._rejectPromise(reason);
        }
    }
    /** then方法 */
    then(onfulfilled = (value) => value, // 设置默认
    onRejected = (reason) => {
        //设置默认，这里为了可以把错误传递下去
        throw reason;
    }) {
        return new MyPromise((resolve, reject) => {
            const thenTask = (state = EMyPromiseState.FULFILLED) => {
                queueMicrotask(function () {
                    try {
                        /** 获得 onfulfilled / onRejected 返回的原始值  */
                        const thenOriginResult = state === EMyPromiseState.FULFILLED
                            ? //@ts-ignore
                                onfulfilled(this.value)
                            : //@ts-ignore
                                onRejected(this.value);
                        //@ts-ignore
                        if (this === thenOriginResult) {
                            throw new Error('then方法不能返回当前MyPromise对象！');
                        }
                        /** duck检测 */
                        if (MyPromise._duckTest(thenOriginResult)) {
                            MyPromise._handleThenable(thenOriginResult, resolve, reject);
                        }
                        else {
                            /** 都不是 按照普通类型处理 */
                            resolve(thenOriginResult);
                        }
                    }
                    catch (err) {
                        reject(err);
                    }
                }.bind(this));
            };
            if (this._isMyPrimiseDecided()) {
                /** 当promise已经决策, 直接运行onfulfilled/onRejected */
                thenTask(this.state);
            }
            else {
                /** 未决策，加入对应队列 两个都加入*/
                this.onFulfilledCallbacks.push(thenTask.bind(this, EMyPromiseState.FULFILLED));
                this.onRejectedCallbacks.push(thenTask.bind(this, EMyPromiseState.REJECTED));
            }
        });
    }
    /** 最后处理错误 */
    catch(catchHandler = () => { }) {
        /** 相当于仅调用失败的promise */
        return this.then((val) => val, (err) => {
            catchHandler(err);
        });
    }
    /** 最终处理 */
    finally(finallyHandler = () => { }) {
        this.then(() => {
            finallyHandler();
        }, () => {
            finallyHandler();
        });
    }
    /** 鸭子检测：
     *  thenable协议： 对象/函数上包含then函数即可
     */
    static _duckTest(thenable) {
        return (thenable &&
            (typeof thenable === 'function' || typeof thenable === 'object') &&
            typeof thenable.then === 'function');
    }
    /** 递归处理thenable */
    static _handleThenable(thenableObj, resolve, reject) {
        if (thenableObj instanceof MyPromise) {
            return thenableObj.then(resolve, reject);
        }
        else if (typeof thenableObj.then === 'function') {
            return thenableObj.then((val) => {
                MyPromise._handleThenable(val, resolve, reject);
            }, (reason) => {
                reject(reason);
            });
        }
        else {
            return resolve(thenableObj);
        }
    }
    /** 返回一个成功的MyPromise */
    /** 过滤thenable
     * 1. 如果是MyPrimise类型，判读是否是当前myPromise，防止形成环,是则报错，否则直接返回
     * 2. duck检测，检查是不是thenable，是则封装成MyPromise 否则直接封装到成功的MyPromise
     */
    static resolve(value) {
        /** duck检测 */
        if (MyPromise._duckTest(value)) {
            return new MyPromise((resolve, reject) => {
                MyPromise._handleThenable(value, resolve, reject);
            });
        }
        /** 都不是 按照普通类型处理 */
        return new MyPromise((resolve) => {
            resolve(value);
        });
    }
    /** 返回一个失败的MyPromise */
    static reject(reason) {
        return new MyPromise((_, reject) => {
            reject(reason);
        });
    }
    static all(myPromises) {
        const resultList = [];
        let fulfilledCnt = 0;
        return new MyPromise((resolve, reject) => {
            for (let i = 0; i < myPromises.length; i++) {
                const myPrimise = myPromises[i];
                myPrimise.then((value) => {
                    resultList[i] = value;
                    if (++fulfilledCnt === myPromises.length) {
                        resolve(resultList);
                    }
                }, () => {
                    reject();
                });
            }
        });
    }
    static any(myPromises) {
        const AggregateError = [];
        let rejectedCnt = 0;
        return new MyPromise((resolve, reject) => {
            for (let i = 0; i < myPromises.length; i++) {
                const myPrimise = myPromises[i];
                myPrimise.then((val) => {
                    resolve(val);
                }, (reason) => {
                    AggregateError[i] = reason;
                    if (++rejectedCnt === myPromises.length) {
                        reject(AggregateError);
                    }
                });
            }
        });
    }
    static race(myPromises) {
        return new MyPromise((resolve, reject) => {
            myPromises.forEach((myPromise) => {
                myPromise.then(resolve, reject);
            });
        });
    }
    static allSettled(myPromises) {
        const resultList = [];
        let decideCnt = 0;
        return new MyPromise((resolve) => {
            for (let i = 0; i < myPromises.length; i++) {
                const myPrimise = myPromises[i];
                myPrimise.then((val) => {
                    resultList[i] = {
                        status: EMyPromiseState.FULFILLED,
                        value: val,
                    };
                    if (++decideCnt === myPromises.length) {
                        resolve(resultList);
                    }
                }, (reason) => {
                    resultList[i] = {
                        status: EMyPromiseState.REJECTED,
                        value: reason,
                    };
                    if (++decideCnt === myPromises.length) {
                        resolve(resultList);
                    }
                });
            }
        });
    }
}
/** 导出MyPromise */
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (MyPromise);

var __webpack_exports__default = __webpack_exports__["default"];
export { __webpack_exports__default as default };
