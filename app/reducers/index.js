import { project } from './project';
import { combineReducers } from 'redux';
import { editor } from './editor';
import { nodeTypes } from './nodetypes';
import { patches } from './patches';
import { nodes } from './nodes';
import { pins } from './pins';
import { links } from './links';
import { viewState } from './viewstate';

export default combineReducers({
  project,
  patches,
  nodes,
  pins,
  links,
  nodeTypes,
  editor,
  viewState,
});
