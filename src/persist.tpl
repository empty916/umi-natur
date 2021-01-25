import createPersistMiddleware from 'natur-persist';


const { middleware: localStorageMiddleware, getData, clearData } = createPersistMiddleware({
	{{#name}}
	name: '{{{ name }}}',
	{{/name}}
	{{#time}}
	time: {{{ time }}},
	{{/time}}
	{{#include.length}}
	include: [
		{{#include}}
		{{{.}}},
		{{/include}}
	],
	{{/include.length}}
	{{#exclude.length}}
	exclude: [
		{{{.}}},
	],
	{{/exclude.length}}
	{{#specific}}
	specific: {{{specific}}},
	{{/specific}}
	{{#storageType}}
	storageType: '{{{storageType}}}',
	{{/storageType}}
});

export {
	localStorageMiddleware,
	getData,
	clearData,
};
