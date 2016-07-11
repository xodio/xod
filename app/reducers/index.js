import { meta } from './meta';
import { editor } from './editor';
import { nodeTypes } from './nodetypes';
import { patches } from './patches';
import { nodes } from './nodes';
import { pins } from './pins';
import { links } from './links';
import { errors } from './errors';

import combineReducersWithContext, { combineReducersWithContextAndCatcher } from './combineWithContext';

export default combineReducersWithContextAndCatcher({
  project: combineReducersWithContext({
    meta,
    patches,
    nodes,
    pins,
    links,
  }),
  nodeTypes,
  editor,
  errors,
});
