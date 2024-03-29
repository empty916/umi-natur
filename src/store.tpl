import { createStore, createInject, createUseInject } from 'natur';
{{#isSSR}}
import { Component } from 'react';
import NaturService from 'natur-service';
{{/isSSR}}
import {
	promiseMiddleware,
	shallowEqualMiddleware,
	{{^useImmer}}
	thunkMiddleware,
	{{/useImmer}}
	filterUndefinedMiddleware,
	fillObjectRestDataMiddleware,
} from 'natur/dist/middlewares';

{{#useImmer}}
import { thunkMiddleware } from 'natur-immer';
{{/useImmer}}



{{#devtool}}
import devTool from './redux-devtool';
{{/devtool}}
{{#persist}}
import { localStorageMiddleware, getData, clearData } from './persist';
{{/persist}}
{{#isSSR}}
import { createPromiseWatcherMiddleware } from 'natur-promise-watcher';
{{/isSSR}}
{{{importModulesCode}}}


{{#isSSR}}
/**
 * whether browser env
 * 
 * @returns boolean
 */
function isBrowser(): boolean {
	return typeof window !== 'undefined' &&
	typeof window.document !== 'undefined' &&
	typeof window.document.createElement !== 'undefined'
}
  
const isPromise = (target: any): target is Promise<any> => {
	return (
		typeof target?.then === "function" &&
		typeof target?.catch === "function" &&
		typeof target?.finally === "function"
	);
};
{{/isSSR}}

const modules = {{{modules}}};
const lazyModules = {{{lazyModules}}};

export type M = typeof modules;
export type LM = typeof lazyModules;

{{#useService}}
export { BaseService } from './BaseService'
{{/useService}}

export const _createStore = () => {
	{{#isSSR}}
	const { collectPromiseMiddleware, promiseActionsFinishedPromise } = createPromiseWatcherMiddleware();
	{{/isSSR}}
	return createStore(modules, lazyModules, {
		interceptors: [
			{{#hasInterceptors}}
			...userInterceptors(() => store),
			{{/hasInterceptors}}
		],
		middlewares: [
			{{#hasMiddlewares}}
			...userMiddlewares(() => store),
			{{/hasMiddlewares}}
			{{^hasMiddlewares}}
			thunkMiddleware,
			{{#isSSR}}
			() => next => record => {
				const res = next(record);
				if (isPromise(record.state) && !isBrowser()) {
					return res.then((data: any) => promiseActionsFinishedPromise()
						.then(() => data));
				}
				return res;
			},
			{{/isSSR}}
			{{#isSSR}}
			collectPromiseMiddleware,
			{{/isSSR}}
			promiseMiddleware,
			fillObjectRestDataMiddleware,
			shallowEqualMiddleware,
			filterUndefinedMiddleware,
			{{#devtool}}
			devTool,
			{{/devtool}}
			{{#persist}}
			localStorageMiddleware,
			{{/persist}}
			{{/hasMiddlewares}}
		],
		
	});
};


export const store = _createStore();

// export default store;

export type StoreType = typeof store.type;
export type Store = typeof store;

{{#persist}}
export {
	clearData,
}
{{/persist}}

export const inject = createInject({
	storeGetter: () => store,
});

export const useInject = createUseInject(() => store);
export const useFlatInject = createUseInject(() => store, {flat: true});

{{#persist}}
if (getData()) {
	store.globalSetStates(getData());
}
{{/persist}}

{{#isSSR}}
if (isBrowser() && (window as any).g_useSSR) {
	store.globalSetStates((window as any).g_initialProps : {})
}
{{/isSSR}}

{{#isSSR}}
export class NaturContainer extends Component {
  store: typeof store | undefined;
  serviceList: NaturService<M, LM>[] = [];
  componentWillUnmount() {
    try {
      // 释放 gc
	  this.serviceList.forEach(s => s.destroy());
	  this.serviceList = [];
	  this.store?.destroy();
      this.store = undefined;
    } catch(e) {
      console.error(e);
    }
  }
  render() {
    if (!isBrowser() && (this.props as any).ctx?.store) {
      this.store = (this.props as any).ctx.store as any;
	  (global as any).store = this.store;
	  (this.props as any).ctx.store = undefined;
    }
	if (!isBrowser() && (this.props as any).ctx?.serviceList) {
	  this.serviceList = (this.props as any).ctx.serviceList as any;
	  (this.props as any).ctx.serviceList = undefined;
	}
    return this.props.children;
  }
}
{{/isSSR}}
