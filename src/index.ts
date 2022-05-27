import { IApi } from '@umijs/types';
import { readFileSync } from 'fs';
import { join } from 'path';
import getModules from './getModules';
import getService from './getService';
import { chokidar, yParser } from '@umijs/utils';

const args = yParser(process.argv.slice(2), {
  alias: {
    version: ['v'],
    help: ['h'],
  },
  boolean: ['version'],
});

export default (api: IApi) => {
  const {
    cwd,
    pkg,
    utils: { Mustache },
  } = api;
  const isDEV = process.env.NODE_ENV === 'development' && args._[0] === 'dev';

  api.describe({
    key: 'natur',
    config: {
      schema(joi) {
        return joi.object({
          persist: joi.object({
            name: joi.string(),
            time: joi.number(),
            include: joi
              .array()
              .items(joi.string(), joi.object().instance(RegExp)),
            exclude: joi
              .array()
              .items(joi.string(), joi.object().instance(RegExp)),
            specific: joi.object(),
            storageType: joi
              .string()
              .pattern(/^(localStorage|sessionStorage)$/),
          }),
          service: joi.object({
            dirName: joi.string(),
            superClassName: joi.string(),
            ignore: joi.array().items(joi.object().instance(RegExp)),
          }),
          useImmer: joi.bool(),
          dirName: joi.string(),
          taskPromise: joi.bool(),
          isSyncModule: joi.function(),
          interceptors: joi.string(),
          middlewares: joi.string(),
        });
      },
    },
  });
  (function addUmiExports() {
    if (!api.userConfig.natur) {
      return;
    }
    api.addUmiExports(() => {
      return {
        source: '../store',
        specifiers: [
          {
            local: 'default',
            exported: 'store',
          },
          'inject',
          'Store',
        ],
      };
    });
    if (!!api.userConfig?.natur?.service) {
      api.addUmiExports(() => {
        return {
          source: '../store/BaseService',
          specifiers: [
            {
              local: 'default',
              exported: 'BaseService',
            },
          ],
        };
      });
      api.addEntryImports(() => {
        return [
          {
            source: './service',
          },
        ];
      });
    }
  })();

  api.onGenerateFiles(() => {
    if (!api.userConfig.natur) {
      return;
    }
    const storeTpl = readFileSync(join(__dirname, 'store.tpl'), 'utf-8');
    const runtimeTpl = readFileSync(join(__dirname, 'runtime.tpl'), 'utf-8');

    const defaultIsSyncModule = (filePath: string) => true;
    const isSSR = !!api.userConfig?.ssr;
    const usePersist = !!api.userConfig?.natur?.persist && !api.userConfig?.ssr;
    const useImmer = !!api.userConfig?.natur?.useImmer;

    const getPath = () => {
      const srcPath = api.paths.absSrcPath || join(cwd, 'src');
      const relativePath = api.userConfig?.natur?.dirName || 'store';
      const serviceDirName =
        api.userConfig?.natur?.service?.dirName || 'service';
      return {
        srcPath,
        relativePath,
        serviceDirName,
      };
    };

    const _getModules = () => {
      const { srcPath, relativePath } = getPath();
      return getModules({
        srcPath,
        relativePath,
        isSyncModule: isSSR
          ? defaultIsSyncModule
          : api.userConfig?.natur?.isSyncModule || defaultIsSyncModule,
      });
    };

    const genStoreIndexFile = () => {
      const taskPromise = !!api.userConfig?.natur?.taskPromise;
      const interceptors = api.userConfig?.natur?.interceptors;
      const middlewares = api.userConfig?.natur?.middlewares;

      let {
        importModulesCode,
        modulesObjCode,
        lazyModulesObjCode,
      } = _getModules();

      if (interceptors) {
        importModulesCode =
          `import userInterceptors from '${interceptors}';\n` +
          importModulesCode;
      }
      if (middlewares) {
        importModulesCode =
          `import userMiddlewares from '${middlewares}';\n` + importModulesCode;
      }

      api.writeTmpFile({
        path: 'store/index.ts',
        content: Mustache.render(storeTpl, {
          importModulesCode: importModulesCode,
          modules: modulesObjCode,
          lazyModules: lazyModulesObjCode,
          persist: usePersist,
          devtool: isDEV,
          taskPromise,
          hasInterceptors: !!interceptors,
          hasMiddlewares: !!middlewares,
          isSSR,
          useImmer,
        }),
        skipTSCheck: false,
      });
    };

    const genServiceFile = () => {
      const { srcPath, serviceDirName } = getPath();

      const {
        superClassName = 'BaseService',
        ignore = [],
      } = api.userConfig?.natur?.service;
      const { exportServiceInstanceCode, exportClassModuleCode } = getService({
        srcPath,
        relativePath: serviceDirName,
        api,
        superClassName,
        ignore,
      });
      api.writeTmpFile({
        path: 'service/serviceObj.ts',
        content: exportClassModuleCode,
        skipTSCheck: false,
      });
      api.writeTmpFile({
        path: 'service/index.ts',
        content: exportServiceInstanceCode,
        skipTSCheck: false,
      });
    };
    const genRuntimeFile = () => {
      if (isSSR) {
        api.writeTmpFile({
          path: 'store/runtime.ts',
          content: Mustache.render(runtimeTpl, {
            isSSR,
            hasService: !!api.config.natur?.service,
          }),
          skipTSCheck: false,
        });
      }
    };
    genRuntimeFile();
    genStoreIndexFile();
    if (!!api.userConfig?.natur?.service) {
      genServiceFile();
    }
    const watch = process.env.WATCH !== 'none';
    if (watch && isDEV) {
      const { srcPath, relativePath, serviceDirName } = getPath();
      const storeFileWatcher = chokidar.watch(join(srcPath, relativePath), {
        ignoreInitial: true,
      });
      storeFileWatcher.on('all', () => {
        genStoreIndexFile();
      });
      if (!!api.userConfig?.natur?.service) {
        const serviceFileWatcher = chokidar.watch(
          join(srcPath, serviceDirName),
          {
            ignoreInitial: true,
          },
        );
        serviceFileWatcher.on('all', () => {
          genServiceFile();
        });
      }
    }

    if (isDEV) {
      const reduxdevTpl = readFileSync(
        join(__dirname, 'redux-devtool.tpl'),
        'utf-8',
      );
      api.writeTmpFile({
        path: 'store/redux-devtool.ts',
        content: Mustache.render(reduxdevTpl, {}),
        skipTSCheck: false,
      });
    }

    if (!!api.userConfig?.natur?.service) {
      const baseServiceTpl = readFileSync(
        join(__dirname, 'BaseService.tpl'),
        'utf-8',
      );
      api.writeTmpFile({
        path: 'store/BaseService.ts',
        content: Mustache.render(baseServiceTpl, {}),
        skipTSCheck: false,
      });
    }
    if (usePersist) {
      const persistTpl = readFileSync(join(__dirname, 'persist.tpl'), 'utf-8');
      const naturConfig = api.userConfig?.natur;
      const persistConfig = naturConfig?.persist;

      const {
        name = '_data',
        time = 300,
        include = [],
        exclude = [],
        specific = {},
        storageType = 'localStorage',
      } = persistConfig;
      api.writeTmpFile({
        path: 'store/persist.ts',
        content: Mustache.render(persistTpl, {
          name,
          time,
          include: include.map((i: string | RegExp) => {
            if (typeof i === 'string') {
              return JSON.stringify(i);
            }
            return i;
          }),
          exclude: exclude.map((i: string | RegExp) => {
            if (typeof i === 'string') {
              return JSON.stringify(i);
            }
            return i;
          }),
          specific: JSON.stringify(specific),
          storageType,
        }),
        skipTSCheck: false,
      });
    }
  });
  api.addRuntimePlugin(() => {
    if (!!api.config.ssr) {
      return [join(api.paths.absTmpPath!, 'store/runtime.ts')];
    }
    return [];
  });
};
