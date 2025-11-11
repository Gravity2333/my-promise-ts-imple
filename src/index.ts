/** Promise状态
 *  FulFilled 成功
 *  Rejected 失败
 *  Pending 未决策
 */
enum MyPromiseState {
  FULFILLED = "fulfilled",
  REJECTED = "rejected",
  PENDING = "pending",
}

/** Promise值 */
type Value = any;

/** 成功回调 */
type OnFulfilled = (value: Value) => any;

/** 失败回调 */
type OnRejected = (reason: any) => any;

/** 执行器 */
type Executor = (onFulfilled: OnFulfilled, onRejected: OnRejected) => void;

/** 把任务推入微任务队列，如果没有queueMicrotask， 使用settimeout 兼容运行环境 */
const pushToMicroTask =
  typeof queueMicrotask === "function" ? queueMicrotask : setTimeout;

type Thenable = {
  then: (onFulfilled: OnFulfilled, onRejected: OnRejected) => any;
};

/** allsettled返回值 */
type AllSettledReturns = {
  status: MyPromiseState;
  value: any;
};

/**
 * 实现一个Promise对象
 */
export default class MyPromise {
  // Promise状态
  private state: MyPromiseState = MyPromiseState.PENDING;
  // 成功回调list 在promise成功后调用
  private onFulfilledTasks: VoidFunction[] = [];
  // 失败回调list 在promise失败后调用
  private onRejectedTasks: VoidFunction[] = [];
  // 值
  private value: Value;
  // 构造函数
  constructor(executor: Executor) {
    try {
      // 执行执行器，传入resolvePromise / rejectPromise
      executor(this._resolvePromise.bind(this), this._rejectPromise.bind(this));
    } catch (e) {
      /** 这里需要用try ... catch包一下, 执行器执行的过程中，如果出现异常，直接reject掉promise */
      this._rejectPromise(e);
    }
  }

  /** 判断当前Promise是否被决策 */
  private _isPromiseDecided() {
    return this.state !== MyPromiseState.PENDING;
  }

  /** 用来resolve当前Promise */
  private _resolvePromise(value: Value) {
    /** 只有在Promise没有决策的情况下才能调用 */
    if (!this._isPromiseDecided()) {
      if (MyPromise._isThenable(value)) {
        MyPromise.resolve(value).then(
          this._resolvePromise.bind(this),
          this._rejectPromise.bind(this)
        );
      } else {
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
  private _rejectPromise(reason: any) {
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
  private static _isThenable(thenable: any) {
    if (typeof thenable === "object" || typeof thenable === "function") {
      if (typeof thenable?.then === "function") {
        return true;
      }
    }
    return false;
  }

  /**  处理thenable */
  private static _handleThenable(
    thenable: Thenable,
    onFulfilled: OnFulfilled,
    onRejected: OnRejected
  ) {
    if (this._isThenable(thenable)) {
      thenable.then(
        (value) => {
          this._handleThenable(value, onFulfilled, onRejected);
        },
        (reason) => {
          onRejected(reason);
        }
      );
    } else {
      onFulfilled(thenable);
    }
  }

  /** then方法
   *  1. 根据Promise的状态，决定调用哪个回调
   *  2. 根据回调的返回结果，确定then函数的返回结果
   */
  public then(
    onFulfilled: OnFulfilled = (value) => value,
    onRejected: OnRejected = (reason) => {
      // 把异常抛出去 方便后面catch接收
      throw reason;
    }
  ): MyPromise {
    // then返回的一定是个Promise
    return new MyPromise((resolve, reject) => {
      /** 在微任务中执行then任务 */
      const _runThenTask = () => {
        pushToMicroTask(() => {
          try {
            let callbackResult: any;
            /** 根据state 执行对应的回调 */
            if (this.state === MyPromiseState.FULFILLED) {
              callbackResult = onFulfilled(this.value);
            } else if (this.state === MyPromiseState.REJECTED) {
              callbackResult = onRejected(this.value);
            } else {
              return;
            }

            /** 需要判断，返回结果不能是当前Promise本身，否则会出现死循环 */
            if (callbackResult === this) {
              throw new Error("then方法不能返回本身的MyPromise");
            }

            if (MyPromise._isThenable(callbackResult)) {
              // 鸭子检测 查看是不是thenable
              MyPromise._handleThenable(callbackResult, resolve, reject);
            } else if (callbackResult instanceof MyPromise) {
              callbackResult.then(resolve, reject);
            } else {
              // 直接resolve
              resolve(callbackResult);
            }
          } catch (e) {
            reject(e);
          }
        });
      };
      // 把resolve和reject函数交付
      if (this._isPromiseDecided()) {
        // 已经决策了，直接执行任务
        _runThenTask();
      } else {
        // 还没决策，把任务放到任务队列中
        this.onFulfilledTasks.push(_runThenTask.bind(this));
        this.onRejectedTasks.push(_runThenTask.bind(this));
      }
    });
  }

  /** catch 就是相当于代理了then*/
  public catch(catchHandler: (error: any) => any) {
    this.then((value) => value, catchHandler);
  }

  /** finally 透传递 */
  public finally(finallyHandler: () => any) {
    this.then(finallyHandler, finallyHandler);
  }

  /** resolve方法 返回一个成功的Resolve 或者根据thenable转换 */
  public static resolve(thenable: any) {
    return new MyPromise((resolve, reject) => {
      this._handleThenable(thenable, resolve, reject);
    });
  }

  /** 返回一个失败的promise */
  public static reject(reason: any) {
    return new MyPromise((resolve, reject) => {
      reject(reason);
    });
  }

  /** all 所有都成功 返回valueList */
  public static all(promises: MyPromise[]) {
    const valueList: any[] = [];
    let successCnt = 0;
    return new MyPromise((resolve, rehject) => {
      for (let i = 0; i < promises.length; i++) {
        const currengPromise = promises[i];
        currengPromise.then(
          (value) => {
            valueList[i] = value;
            if (++successCnt === promises.length) {
              resolve(valueList);
            }
          },
          (reason) => {
            this.reject(reason);
          }
        );
      }
    });
  }

  /** 所有都决定了 注意返回值 {status,value} */
  public static allSettled(promises: MyPromise[]) {
    const allSettledReturns: AllSettledReturns[] = [];
    let settedCnt = 0;
    return new Promise((resolve) => {
      for (let i = 0; i < promises.length; i++) {
        const currentPromise = promises[i];
        currentPromise.then(
          (value) => {
            allSettledReturns[i] = {
              status: MyPromiseState.FULFILLED,
              value,
            };
            if (++settedCnt === promises.length) {
              resolve(allSettledReturns);
            }
          },
          (reason) => {
            allSettledReturns[i] = {
              status: MyPromiseState.REJECTED,
              value: reason,
            };
            if (++settedCnt === promises.length) {
              resolve(allSettledReturns);
            }
          }
        );
      }
    });
  }

  /** rece 返回第一个 */
  public static race(promises: MyPromise[]) {
    return new MyPromise((resolve, reject) => {
      for (const promise of promises) {
        promise.then(resolve, reject);
      }
    });
  }

  /** any 有一个成功 */
  public static any(promises: MyPromise[]) {
    let rejectedCnt = 0;
    return new MyPromise((resolve, reject) => {
      for (const promise of promises) {
        promise.then(
          (value) => {
            resolve(value);
          },
          (reason) => {
            if (++rejectedCnt === promises.length) {
              reject(new AggregateError("All promises were rejected"));
            }
          }
        );
      }
    });
  }
}
