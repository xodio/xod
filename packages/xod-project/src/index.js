import * as project from './project';
import * as patch from './patch';
import * as node from './node';
import * as pin from './pin';
import * as link from './link';
import * as constants from './constants';
import * as utils from './utils';
import * as funcTools from './func-tools';
import * as types from './types';
import flatten from './flatten';
import { toV2 } from './adapter';

export * from './project';
export * from './patch';
export * from './node';
export * from './pin';
export * from './link';
export * from './constants';
export * from './utils';
export * from './func-tools';
export * from './types';
export { toV2 } from './adapter';
export { default as flatten } from './flatten';

export default Object.assign({
  toV2,
  flatten,
},
  project,
  patch,
  node,
  pin,
  link,
  constants,
  utils,
  funcTools,
  types
);
