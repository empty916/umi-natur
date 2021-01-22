import createPersistMiddleware from 'natur-persist';


const { middleware: localStorageMiddleware, getData, clearData } = createPersistMiddleware({
	name: '{{{ name }}}',
	time: {{{ time }}},
	include: [
		{{#include}}
		{{{.}}},
		{{/include}}
	],
	exclude: [
		{{#exclude}}
		{{{.}}},
		{{/exclude}}
	],
	specific: {{{specific}}},
	storageType: '{{{storageType}}}',
});

export {
	localStorageMiddleware,
	getData,
	clearData,
};
