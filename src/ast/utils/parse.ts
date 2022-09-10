// import { t, parser } from '@umijs/utils';
import * as t from '@umijs/bundler-utils/compiled/babel/types';
import * as parser from '@umijs/bundler-utils/compiled/babel/parser';

export function parse(code: string): t.File {
  return parser.parse(code, {
    sourceType: 'module',
    plugins: [
      'jsx',
      'typescript',
      'classProperties',
      'dynamicImport',
      'exportDefaultFrom',
      'exportNamespaceFrom',
      'functionBind',
      'nullishCoalescingOperator',
      'objectRestSpread',
      'optionalChaining',
      'decorators-legacy',
    ],
    allowAwaitOutsideFunction: true,
  });
}
