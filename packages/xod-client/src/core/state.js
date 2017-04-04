import R from 'ramda';
import { toV2 } from 'xod-project';
import core from 'xod-core';

import editorState from '../editor/state';
import projectState from '../project/state';
import projectBrowserState from '../projectBrowser/state';

const initialState = {
  project: projectState,
  projectHistory: {},
  projectBrowser: projectBrowserState,
  editor: editorState,
  errors: {},
  processes: {},
};

export default R.assoc( // TODO: #migrateToV2
  'projectV2',
  toV2(core.getProjectPojo(initialState)),
  initialState
);
