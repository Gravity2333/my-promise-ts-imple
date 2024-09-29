/** 实现一个Promise */
/** Promise状态枚举 */
declare enum EMyPromiseState {
    /** 未决策状态 */
    'PENDING' = "pending",
    /** 成功状态 */
    'FULFILLED' = "fulfilled",
    /** 拒绝状态 */
    'REJECTED' = "rejected"
}
/** 成功回调类型 */
type OnFulfilled = (value?: any) => any;
/** 失败回调类型 */
type OnRejected = (reason?: any) => any;
/** 执行器 */
type Executor = (resolve: OnFulfilled, reject: OnRejected) => void;
/** MyPromise类型 */
interface IMyPromise {
    /** 状态 */
    state: EMyPromiseState;
    /** 值 ｜ 错误原因 */
    value: any;
    /** then方法，满足thenable协议 */
    then: (onfulfilled?: OnFulfilled, onRejected?: OnRejected) => IMyPromise;
    /** catch方法 */
    catch: (catchHandler: (err: any) => void) => void;
    /** finally 方法 */
    finally: (finallyHandler: () => void) => void;
    /** ---- 静态方法 ---- */
    /** 返回成功MyPromise */
    readonly resolve?: (value: any) => IMyPromise;
    /** 返回失败MyPromise */
    readonly reject?: (value: any) => IMyPromise;
    /** all方法 */
    readonly all?: (myPromises: IMyPromise[]) => IMyPromise;
    /** any方法 */
    readonly any?: (myPromises: IMyPromise[]) => IMyPromise;
    /** race方法 */
    readonly race?: (myPromises: IMyPromise[]) => IMyPromise;
    /** allSettled方法 */
    readonly allSettled?: (myPromises: IMyPromise[]) => IMyPromise[];
}
declare class MyPromise implements IMyPromise {
    /** 成功回调缓存 */
    private onFulfilledCallbacks;
    /** 失败回调缓存 */
    private onRejectedCallbacks;
    /** 状态 */
    state: EMyPromiseState;
    /** value */
    value: any;
    /** 用来判断promise是否已经决策 */
    private _isMyPrimiseDecided;
    /** 实现决策成功promise */
    private _resolvePromiseImpl;
    /** 实现决失败promise */
    private _rejectPromiseImpl;
    /** 用来决策成功promise */
    private _resolvePromise;
    /** 用来拒绝promise */
    private _rejectPromise;
    /** ctor 穿入执行器函数 */
    constructor(executor: Executor);
    /** then方法 */
    then(onfulfilled?: OnFulfilled, // 设置默认
    onRejected?: OnRejected): MyPromise;
    /** 最后处理错误 */
    catch(catchHandler?: (err: any) => void): MyPromise;
    /** 最终处理 */
    finally(finallyHandler?: () => any): void;
    /** 鸭子检测：
     *  thenable协议： 对象/函数上包含then函数即可
     */
    private static _duckTest;
    /** 递归处理thenable */
    private static _handleThenable;
    /** 返回一个成功的MyPromise */
    /** 过滤thenable
     * 1. 如果是MyPrimise类型，判读是否是当前myPromise，防止形成环,是则报错，否则直接返回
     * 2. duck检测，检查是不是thenable，是则封装成MyPromise 否则直接封装到成功的MyPromise
     */
    static resolve(value?: any): MyPromise;
    /** 返回一个失败的MyPromise */
    static reject(reason?: any): MyPromise;
    static all(myPromises: IMyPromise[]): MyPromise;
    static any(myPromises: IMyPromise[]): MyPromise;
    static race(myPromises: IMyPromise[]): MyPromise;
    static allSettled(myPromises: IMyPromise[]): MyPromise;
}
/** 导出MyPromise */
export default MyPromise;
