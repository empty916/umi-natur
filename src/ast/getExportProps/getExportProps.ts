import { t, traverse } from '@umijs/utils';
import { parse } from '../utils/parse';
import {
  NODE_RESOLVERS,
  findArrayElements,
  findObjectMembers,
} from './propertyResolver';

export function getExportProps(code: string) {
  const ast = parse(code) as babel.types.File;
  let props: unknown = undefined;
  traverse.default(ast, {
    Program: {
      enter(path) {
        const node = path.node as t.Program;
        const defaultExport = findExportDefault(node);
        if (!defaultExport) return;

        if (t.isClassDeclaration(defaultExport)) {
          props = {
            name: defaultExport?.id?.name,
            superName: (defaultExport?.superClass as t.Identifier)?.name,
          };
        } else if (t.isIdentifier(defaultExport)) {
          const classDeclaration = findExportDefaultClassDeclaration(
            path.node,
            defaultExport,
          );
          if (classDeclaration) {
            props = {
              name: classDeclaration.id.name,
              superName: (classDeclaration?.superClass as t.Identifier)?.name,
            };
          } else {
            const { name } = defaultExport;
            props = findAssignmentExpressionProps({
              programNode: node,
              name,
            });
          }
        } else if (t.isObjectExpression(defaultExport)) {
          props = findObjectMembers(defaultExport);
        } else if (t.isArrayExpression(defaultExport)) {
          props = findArrayElements(defaultExport);
        } else {
          const resolver = NODE_RESOLVERS.find(resolver =>
            resolver.is(defaultExport),
          );
          if (resolver) {
            props = resolver.get(defaultExport as any);
          }
        }
      },
    },
  });
  return props;
}

function findExportDefault(programNode: t.Program) {
  for (const n of programNode.body) {
    if (t.isExportDefaultDeclaration(n)) {
      return n.declaration;
    }
  }
  return null;
}

function findExportDefaultClassDeclaration(
  programNode: t.Program,
  exportDefaultNode: t.Identifier,
) {
  for (const n of programNode.body) {
    if (t.isClassDeclaration(n) && n.id.name === exportDefaultNode.name) {
      return n;
    }
  }
  return null;
}

function findAssignmentExpressionProps(opts: {
  programNode: t.Program;
  name: string;
}) {
  const props: Partial<Record<keyof any, unknown>> = {};
  for (const n of opts.programNode.body) {
    let node: t.Node = n;
    if (t.isExpressionStatement(node)) {
      node = node.expression;
    }
    if (
      t.isAssignmentExpression(node) &&
      t.isMemberExpression(node.left) &&
      t.isIdentifier(node.left.object) &&
      node.left.object.name === opts.name
    ) {
      const resolver = NODE_RESOLVERS.find(resolver =>
        resolver.is(t.isAssignmentExpression(node) && node.right),
      );
      if (resolver) {
        props[(node.left.property as any).name] = resolver.get(
          node.right as any,
        );
      }
    }
  }
  return props;
}
