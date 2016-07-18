import undoable from 'redux-undo';

import { meta } from './meta';
import { editor } from './editor';
import { nodeTypes } from './nodetypes';
import { patches } from './patches';
import { nodes } from './nodes';
import { pins } from './pins';
import { links } from './links';
import { errors } from './errors';

import combineReducersWithContext from './combineWithContext';

const projectReducer = combineReducersWithContext({
  meta,
  patches,
  nodes,
  pins,
  links,
});
const projectUndoConfig = {
  limit: 10,
};

export default combineReducersWithContext({
  project: undoable(projectReducer, projectUndoConfig),
  nodeTypes,
  editor,
  errors,
});
