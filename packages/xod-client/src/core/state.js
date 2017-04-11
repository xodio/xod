import editorState from '../editor/state';
import projectState from '../project/state';
import projectBrowserState from '../projectBrowser/state';

export default {
  projectV2: projectState,
  projectHistory: {},
  projectBrowser: projectBrowserState,
  editor: editorState,
  errors: {},
  processes: {},
};
