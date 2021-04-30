import { getExportProps } from './ast';
import { readFileSync } from 'fs';
import { join } from 'path';
import glob from 'glob';
import { isStoreModule } from 'natur/dist/utils';

type getModulesArg = {
  srcPath: string;
  relativePath: string;
  isSyncModule: Function;
};
const firstCharToLowerCase = (str: string) =>
  str.slice(0, 1).toLowerCase() + str.slice(1);

const getModules = ({ srcPath, relativePath, isSyncModule }: getModulesArg) => {
  const storeModuleTargetDir = join(srcPath, relativePath);
  let files = glob.sync(join(storeModuleTargetDir, '**', '*.{j,t}s'));

  files = files
    .filter(f => {
      const fileCode = readFileSync(f, 'utf-8');
      const res = getExportProps(fileCode);
      return !!res && isStoreModule(res);
    })
    .map(f => f.replace(srcPath, '@'));

  const fileNames = files
    .map(f =>
      f
        .replace(`@/${relativePath}`, '')
        .slice(1)
        // 删除扩展名
        .replace(/\.(j|t)s$/, '')
        // 删除 [, ] , $之类的特殊字符
        .replace(/\[|\]|\$|\s/g, '')
        // 将aaa/bbb/_c_cc的文件开头的 “_” 删除
        .replace(/(\/)_/g, '$1')
        .replace(/^\d+/, '')
        // 将aaa/bbb/ccc改变为aaaBbbCcc
        .replace(/[\/\-_]([a-zA-Z])/g, (_, s) => s.toUpperCase()),
    )
    .map(firstCharToLowerCase);

  const importModulesCode = fileNames
    .reduce((res, fileName, index) => {
      if (isSyncModule(files[index])) {
        res =
          res +
          `import ${fileName} from '${files[index].replace(
            /\.(j|t)s$/,
            '',
          )}';\n`;
      }
      return res;
    }, '')
    .replace(/\n$/, '');

  const modulesObjCode =
    fileNames.reduce((res, fileName, index) => {
      if (isSyncModule(files[index])) {
        res = res + `   ${fileName},\n`;
      }
      return res;
    }, '{\n') + '}';

  const lazyModulesObjCode =
    fileNames.reduce((res, fileName, index) => {
      if (!isSyncModule(files[index])) {
        res =
          res +
          `   ${fileName}: () => import(/* webpackChunkName: "${fileName}" */ '${files[index]}'),\n`;
      }
      return res;
    }, '{\n') + '}';

  return {
    importModulesCode,
    modulesObjCode,
    lazyModulesObjCode,
    hasModules: !!fileNames.length,
  };
};

export default getModules;
