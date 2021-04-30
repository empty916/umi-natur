import React from 'react';

import { NaturContainer, _createStore } from './index';
import * as serivceObjs from '../service/serviceObj'

export function rootContainer(container, opts) {
  return React.createElement(NaturContainer, opts, container);
}


export const ssr = {
  modifyGetInitialPropsCtx: async (ctx: any) => {
    if (process.env.__IS_SERVER) {
      let store = _createStore();
      ctx.store = store;
      ctx.serviceList = Object.keys(serivceObjs).map(key => new serivceObjs[key](store));
    }
    return ctx;
  },
}
