import { combineReducers } from 'redux';
import { meta } from './meta';
import { editor } from './editor';
import { nodeTypes } from './nodetypes';
import { patches } from './patches';
import { nodes } from './nodes';
import { pins } from './pins';
import { links } from './links';

export default combineReducers({
  project: combineReducers({
    meta,
    patches,
    nodes,
    pins,
    links,
  }),
  nodeTypes,
  editor,
});
