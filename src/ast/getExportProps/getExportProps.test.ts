import { getExportProps } from './getExportProps';
import { isStoreModule } from 'natur/dist/utils';

test('normal', () => {
  const props = getExportProps(
    `
const foo = () => {};
const bar = {};
foo.a = 1;
foo.b = '2';
foo.c = function() {};

foo.d = {
  aa: '1',
  bb: true,
  cc: {
    dd: 90
  },
  ee: [2],
  ff: null,
  gg: undefined,
  hh: () => {},
  jj() {}
};
foo.e = ['hh', { ff: 66 }, ['gg'], null, undefined, () => {}];

foo.f = true;
foo.g = false;
foo.i = null;
foo.j = undefined;
bar.h = true;
export default foo;
    `,
  );
  expect(props).toEqual({
    a: 1,
    b: '2',
    c: expect.any(Function),
    d: {
      aa: '1',
      bb: true,
      cc: {
        dd: 90,
      },
      ee: [2],
      ff: null,
      gg: undefined,
      hh: expect.any(Function),
      jj: expect.any(Function),
    },
    e: ['hh', { ff: 66 }, ['gg'], null, undefined, expect.any(Function)],
    f: true,
    g: false,
    i: null,
    j: undefined,
  });
});

test('export an class directly', () => {
  const props = getExportProps(`
    export default class Page {
      static a = 1
      static b = '2'
      static c = function() {}
      static d = {
        aa: '1',
        bb: true,
        cc: {
          dd: 90
        },
        ee: [2],
        ff: null,
        gg: undefined,
        hh: () => {},
        jj() {}
      }
      static e = ['hh', { ff: 66 }, ['gg'], null, undefined, () => {}]
      static f = true;
      static g = false;
      static i = null;
      static j = undefined;
      static h = true;
    }
  `);
  expect(props).toEqual({
    name: 'Page',
    superName: undefined,
  });
});

test('export an object directly', () => {
  const props = getExportProps(
    `
export default {
  a: {
    aa: 0,
    bb: '1',
    cc() {},
  },
  b: [0, '1', () => {}],
  c: () => {},
  d() {},
};
    `,
  );

  expect(props).toEqual({
    a: {
      aa: 0,
      bb: '1',
      cc: expect.any(Function),
    },
    b: [0, '1', expect.any(Function)],
    c: expect.any(Function),
    d: expect.any(Function),
  });
});

test('export an array directly', () => {
  const props = getExportProps(
    `
export default [null, 1, '2', () => {}, {a: true, b() {}}];
    `,
  );
  expect(props).toEqual([
    null,
    1,
    '2',
    expect.any(Function),
    { a: true, b: expect.any(Function) },
  ]);
});

test('export literal value', () => {
  expect(getExportProps('export default 0;')).toEqual(0);
  expect(getExportProps('export default "1";')).toEqual('1');
  expect(getExportProps('export default true;')).toEqual(true);
  expect(getExportProps('export default null;')).toEqual(null);
});

test('no default export', () => {
  const props = getExportProps(
    `
export function foo () {}
    `,
  );
  expect(props).toEqual(undefined);
});

test('export default natur no map module', () => {
  const props = getExportProps(
    `
export default {
  state: {
    name: 'app'
  },
  actions: {
    update: name => ({name}),
  }
}
    `,
  );
  expect(isStoreModule(props)).toEqual(true);
});

test('export default natur module', () => {
  const props = getExportProps(
    `
export default {
  state: {
    name: 'app'
  },
  maps: {
    m1: ['name', name => name.split(',')],
    m11: [state => state.name, name => name.split(',')],
    m2: ({name}) => name.split(','),
    m3: () => 1,
  },
  actions: {
    update: name => ({name}),
  }
}
    `,
  );
  expect(isStoreModule(props)).toEqual(true);
});

test('export default natur module with identifier', () => {
  const props = getExportProps(
    `
const state1 = {
  name: 'app'
};
const actions1 = {
  update: name => ({name}),
};
const maps1 = {
  m1: ['name', name => name.split(',')],
  m11: [state => state.name, name => name.split(',')],
  m2: ({name}) => name.split(','),
  m3: () => 1,
};
export default {
  state: state1,
  maps: maps1,
  actions: actions1,
}
    `,
  );
  expect(isStoreModule(props)).toEqual(true);
});

test('export default natur module with identifier2', () => {
  const props = getExportProps(
    `
const state1 = {
  name: 'app'
};
const actions1 = {
  update: name => ({name}),
};
const maps1 = {
  m1: ['name', name => name.split(',')],
  m11: [state => state.name, name => name.split(',')],
  m2: ({name}) => name.split(','),
  m3: () => 1,
};
const testModule = {
  state: state1,
  maps: maps1,
  actions: actions1,
};
export default testModule;
    `,
  );
  expect(isStoreModule(props)).toEqual(true);
});
