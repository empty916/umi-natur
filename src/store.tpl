import { createStore, createInject } from 'natur';
import {
	promiseMiddleware,
	shallowEqualMiddleware,
	thunkMiddleware,
	filterUndefinedMiddleware,
	fillObjectRestDataMiddleware,
} from 'natur/dist/middlewares';

{{#devtool}}
import devTool from './redux-devtool';
{{/devtool}}
{{#persist}}
import { localStorageMiddleware, getData, clearData } from './persist';
{{/persist}}
{{#taskPromise}}
import { createPromiseWatcherMiddleware } from 'natur-promise-watcher';
{{/taskPromise}}
{{{importModulesCode}}}

const modules = {{{modules}}};
const lazyModules = {{{lazyModules}}};

export type M = typeof modules;
export type LM = typeof lazyModules;
{{#taskPromise}}

const { collectPromiseMiddleware, promiseActionsFinishedPromise } = createPromiseWatcherMiddleware();
{{/taskPromise}}

const store = createStore(modules, lazyModules, {
    {{#persist}}
    initStates: getData(),
    {{/persist}}
	{{#hasInterceptors}}
	interceptors: userInterceptors(() => store),
	{{/hasInterceptors}}
	middlewares: [
		{{#hasMiddlewares}}
		...userMiddlewares(() => store),
		{{/hasMiddlewares}}
		{{^hasMiddlewares}}
		thunkMiddleware,
		{{#taskPromise}}
		collectPromiseMiddleware,
		{{/taskPromise}}
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

export default store;

export type StoreType = typeof store.type;

{{#taskPromise}}
export {
	promiseActionsFinishedPromise
}
{{/taskPromise}}

{{#persist}}
export {
	clearData,
}
{{/persist}}

export const inject = createInject({
	storeGetter: () => store,
});
