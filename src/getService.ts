import { getExportProps } from './ast';
import { readFileSync } from 'fs';
import { join } from 'path';
import glob from 'glob';
import { IApi } from '@umijs/types';
import { winPath } from '@umijs/utils';

const firstCharToLowerCase = (str: string) =>
  str.slice(0, 1).toLowerCase() + str.slice(1);

const firstCharToUpperCase = (str: string) =>
  str.slice(0, 1).toUpperCase() + str.slice(1);

type getServiceArg = {
  srcPath: string;
  relativePath: string;
  api: IApi;
  superClassName: string;
  ignore: RegExp[];
};

const getService = ({
  srcPath,
  relativePath,
  api,
  ignore,
  superClassName,
}: getServiceArg) => {
  const storeModuleTargetDir = join(srcPath, relativePath);
  let files = glob.sync(join(storeModuleTargetDir, '**', '*.{j,t}s'));
  files = files.filter(fileName => !/\.d\.ts$/.test(fileName));
  const serviceList = files
    .map(f => {
      const fileCode = readFileSync(f, 'utf-8');
      const res = getExportProps(fileCode);

      const isNaturService =
        (!!res && (res as any)?.superName === 'BaseService') ||
        (res as any)?.superName === superClassName;
      let isValidService = true;
      if (isNaturService && !(res as any)?.name) {
        api.logger.warn(
          `文件：${f}中的类没有名字，不建议使用匿名类。此类会被忽略！`,
        );
        isValidService = false;
      }
      if (isNaturService && isValidService) {
        return {
          path: f,
          serviceName: (res as { name: string }).name,
        };
      }
      return null;
    })
    .filter(i => !!i)
    .filter(i => {
      const shouldIgnore = ignore.some(pattern => pattern.test(i!.serviceName));
      return !shouldIgnore;
    })
    .map(f => ({
      serviceName: firstCharToUpperCase(f!.serviceName),
      path: winPath(f!.path),
    }));

  const serviceNames = serviceList.map(s => s.serviceName);

  const importModulesCode = serviceNames
    .reduce((res, serviceName, index) => {
      res =
        res +
        `import ${serviceName} from '${serviceList[index].path.replace(
          /\.(j|t)s$/,
          '',
        )}';\n`;
      return res;
    }, '')
    .replace(/\n$/, '');

  let exportServiceInstanceCode = serviceNames.reduce(
    (res, serviceName, index) => {
      res =
        res +
        `export const ${firstCharToLowerCase(
          serviceName,
        )} = new ${serviceName}();\n`;
      return res;
    },
    '',
  );

  const exportClassModuleCode =
    serviceNames.reduce((res, serviceName, index) => {
      res = res + `   ${serviceName},\n`;
      return res;
    }, importModulesCode + '\n\nexport {\n') + '}';

  const importFromExportClassCode =
    serviceNames.reduce((res, serviceName, index) => {
      res = res + `   ${serviceName},\n`;
      return res;
    }, 'import {\n') + '} from "./serviceObj";\n';

  exportServiceInstanceCode =
    importFromExportClassCode + '\n' + exportServiceInstanceCode;

  return {
    exportServiceInstanceCode,
    exportClassModuleCode,
  };
};

export default getService;
