interface Executor<T> {
  (resolve: (value: T) => void, reject: (reason: any) => void): void;
}

interface OnFulfilled<T, Result> {
  (val: T): typeof MyPromise<Result>;
}

interface OnRejected<Result> {
  (reason: any): typeof MyPromise<Result>;
}

interface MyPromiseType {
  new <T = any>(executor: Executor<T>): MyPromiseInstace<T>;
}

interface MyPromiseInstace<T> {
  then: <OnFulfilledResult = T, onRejectedResult = never>(
    onFulfilled: OnFulfilled<T, OnFulfilledResult>,
    onRejected: OnRejected<onRejectedResult>
  ) => MyPromiseInstace<OnFulfilledResult | onRejectedResult>;
}

//@ts-ignore
const MyPromise: MyPromiseType = function <T>(executor: Executor<T>) {
  /** 成功回调函数列表 */
  const onFulfilledCallbacks: VoidFunction[] = [];
  /** 失败回调函数列表 */
  const onRejectedCallbacks: VoidFunction[] = [];
  /** state */
  let state: "pending" | "fulfilled" | "rejected" = "pending";
  /** 成功值 */
  let onFulfilledValue: T;
  /** 失败值 */
  let onRejectedReason: any;
  /** 执行 executor */
  try {
    executor(_handleResolve, _handleReject);
  } catch (err) {
    _handleReject(err);
  }

  /** 是否已经决策 */
  function _isDecied() {
    return state !== "pending";
  }

  /** 处理 resolve */
  function _handleResolve(value: T) {
    if (!_isDecied()) {
      _handleThenable(
        value as any,
        (_val: any) => {
          state = "fulfilled";
          onFulfilledValue = _val;
          onFulfilledCallbacks.forEach((onFulfilledCallback) =>
            onFulfilledCallback()
          );
        },
        _handleReject
      );
    }
  }

  /** 处理reject */
  function _handleReject(reason: any) {
    if (!_isDecied()) {
      state = "rejected";
      onRejectedReason = reason;
      onRejectedCallbacks.forEach((onRejectedCallback) => onRejectedCallback());
    }
  }

  function _duckTest(mayBeDuck: any) {
    return (
      typeof mayBeDuck === "object" && typeof mayBeDuck?.then === "function"
    );
  }

  function _handleThenable(thenable: { then: any }, resolve: any, reject: any) {
    if (_duckTest(thenable)) {
      thenable.then((val: any) => {
        _handleThenable(val, resolve, reject);
      }, reject);
    } else {
      resolve(thenable);
    }
  }

  function _handleThen(onFulfilled: any, onRejected: any) {
    /** 返回一个新的MyPromise */
    return new MyPromise((resolve, reject) => {
      const runThenCallback = () => {
        queueMicrotask(() => {
          try {
            let result: any;
            if (state === "fulfilled") {
              result = onFulfilled(onFulfilledValue);
            } else if (state === "rejected") {
              result = onRejected(onRejectedReason);
            }

            _handleThenable(result, resolve, reject);
          } catch (err) {
            reject(err);
          }
        });
      };

      if (_isDecied()) {
        runThenCallback();
      } else {
        onFulfilledCallbacks.push(runThenCallback);
        onRejectedCallbacks.push(runThenCallback);
      }
    });
  }

  return {
    then: _handleThen,
    resolve: (val: any) =>
      new MyPromise((r, j) => {
        _handleThenable(val, r, j);
      }),
    reject: (val: any) =>
      new MyPromise((_, reject) => {
        reject(val);
      }),
    catch: (errHandler: any) => _handleThen.bind(() => {}, errHandler),
    finally: () =>
      _handleThen.bind(
        () => {},
        () => {}
      ),
  } as MyPromiseInstace<T>;
};

export default MyPromise;

new MyPromise((resolve, reject) => {
  resolve(111);
});
