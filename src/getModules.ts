import { getExportProps } from './ast';
import { readFileSync } from 'fs';
import { join } from 'path';
import glob from 'glob';
import { isStoreModule } from 'natur/dist/utils';
import { winPath } from '@umijs/utils';

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

  let filesObj = files
    .filter(f => {
      const fileCode = readFileSync(f, 'utf-8');
      const res = getExportProps(fileCode);
      return !!res && isStoreModule(res);
    })
    .map(f => ({
      relativePath: f.replace(srcPath, '@'),
      absPath: winPath(f),
      fileName: '',
    }));

  filesObj = filesObj
    .map(f => ({
      ...f,
      fileName: f.relativePath
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
    }))
    .map(f => ({
      ...f,
      fileName: firstCharToLowerCase(f.fileName),
    }));
  const fileNames = filesObj.map(f => f.fileName);
  files = filesObj.map(f => f.relativePath);

  const importModulesCode = fileNames
    .reduce((res, fileName, index) => {
      if (isSyncModule(files[index])) {
        res =
          res +
          `import ${fileName} from '${filesObj[index].absPath.replace(
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
          `   ${fileName}: () => import(/* webpackChunkName: "${fileName}" */ '${filesObj[
            index
          ].absPath.replace(/\.(j|t)s$/, '')}'),\n`;
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
