import NaturService from 'natur-service';
import type { LM, M } from './index';
import { store } from './index';


export class BaseService extends NaturService<M, LM>{
    constructor(s: typeof store = store) {
        super(s);
        this.start();
    }
    start() {}
    // 重写dispath的默认行为，如果重复执行，并且是懒加载模块，那么就会抛出错误，重写来默认吞掉这种错误
    // dispatch: NaturService<M, LM>['dispatch'] = (...arg) => {
    //     return super.dispatch(arg[0], arg[1], ...(arg as any).slice(2)).catch(e => {
    //         if (e?.code === 0) {
    //             return;
    //         }
    //         throw e;
    //     }) as any;
    // }
};