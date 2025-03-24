/** Promise值 */
type Value = any;
/** 成功回调 */
type OnFulfilled = (value: Value) => any;
/** 失败回调 */
type OnRejected = (reason: any) => any;
/** 执行器 */
type Executor = (onFulfilled: OnFulfilled, onRejected: OnRejected) => void;
/**
 * 实现一个Promise对象
 */
export default class MyPromise {
    private state;
    private onFulfilledTasks;
    private onRejectedTasks;
    private value;
    constructor(executor: Executor);
    /** 判断当前Promise是否被决策 */
    private _isPromiseDecided;
    /** 用来resolve当前Promise */
    private _resolvePromise;
    /** 用来拒拒当前Promise */
    private _rejectPromise;
    /** duck检测，兼容thenable */
    private static _isThenable;
    /**  处理thenable */
    private static _handleThenable;
    /** then方法
     *  1. 根据Promise的状态，决定调用哪个回调
     *  2. 根据回调的返回结果，确定then函数的返回结果
     */
    then(onFulfilled?: OnFulfilled, onRejected?: OnRejected): MyPromise;
    /** catch 就是相当于代理了then*/
    catch(catchHandler: (error: any) => any): void;
    /** finally 透传递 */
    finally(finallyHandler: () => any): void;
    /** resolve方法 返回一个成功的Resolve 或者根据thenable转换 */
    static resolve(thenable: any): MyPromise;
    /** 返回一个失败的promise */
    static reject(reason: any): MyPromise;
    /** all 所有都成功 返回valueList */
    static all(promises: MyPromise[]): MyPromise;
    /** 所有都决定了 注意返回值 {status,value} */
    static allSettled(promises: MyPromise[]): void;
    /** rece 返回第一个 */
    static race(promises: MyPromise[]): MyPromise;
    /** any 有一个成功 */
    static any(promises: MyPromise[]): MyPromise;
}
export {};
