import { combineReducers } from 'redux';
import { editor } from './editor';
import { nodeTypes } from './nodetypes';
import { patches } from './patches';
import { nodes } from './nodes';
import { pins } from './pins';
import { links } from './links';

export const Project = combineReducers({
  patches,
  nodes,
  pins,
  links,
});

export const NodeTypes = combineReducers({
  nodeTypes,
});

export const Editor = combineReducers({
  editor,
});
