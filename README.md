# umi-natur

[![NPM version](https://img.shields.io/npm/v/umi-natur.svg?style=flat)](https://npmjs.org/package/umi-natur) [![NPM downloads](http://img.shields.io/npm/dm/umi-natur.svg?style=flat)](https://npmjs.org/package/umi-natur)

自动生成 natur 代码的的 umi 插件，超级好用

## Install

```bash
# or yarn
$ npm install umi-natur
```

## Usage

Configure in `.umirc.js`,

```ts
export default {
  plugins: [
    ['umi-natur'],
  ],
  /**
   * 插件默认会自动扫描store文件夹下面的文件
   * 如果是合法的natur模块被自动导出，那么会被插件捕捉到，
   * 并将导入代码生成在.umi/store下
   * 你可以这么使用import {store, inject} from 'umi';
   */
  natur: {
    /**
     * 插件默认你的natur模块代码是写在store文件夹下的
     * 如果你的模块是写在其他文件夹下，你也可以修改，比如'pages'
     */
    dirName: 'store',
    /**
     * 根据文件地址判断，这个模块是否同步模块
     * 不是同步模块就是异步模块
     */
    isSyncModule: (filePath: string) => boolean,
    /**
     * 你的interceptors文件地址
     * 这个文件地址必须是默认导出的函数
     * 这个函数的入参是一个获取store的函数，这个函数的返回值必须是一个intercepter数组
     */
    interceptors: string,
    /**
     * 你的middlewares文件地址
     * 这个文件地址必须是默认导出的函数
     * 这个函数的入参是一个获取store的函数，这个函数的返回值必须是一个middlewares数组
     *
     * 一旦你自定义了中间件，那么默认的中间件会被移除，中间件的配置将完全由你决定
     */
    middlewares: string,
    /**
     * 这个是持久化配置
     * 跟natur-persist配置一样
     */
    persist: {
      /* natur-persist config */
    },
    /**
     * 如果你添加了service配置
     * BaseService.ts的基类会在.umi/store下自动生成
     * 你可以这么使用import {BaseService} from 'umi';
     */
    service: {
      /**
       * 插件会扫描service文件夹下的代码，如果在这个文件夹下的文件，有Service类被默认导出
       * 那么Service实例化的代码会被自动生成在.umi/service下
       * 默认是'service'
       */
      dirName: string,
      /**
       * 识别是否是Service class的关键是，如果类是集成于BaseService，才会被导出
       * 同样，如果你是自己定义了一个Service基类，那么你也可以修改这个扫描配置
       * 默认是'BaseService'
       */
      superClassName: string,
      /**
       * 如果你并不想让某些Service类被自动生成代码，那么你可以配置忽略的类名
       */
      ignore: RegExp[],
    }
  }
}
```

## Options

TODO

## LICENSE

MIT
