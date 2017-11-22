import userState from '../user/state';
import editorState from '../editor/state';
import projectState from '../project/state';
import debuggerState from '../debugger/state';
import projectBrowserState from '../projectBrowser/state';

export default {
  user: userState,
  project: projectState,
  projectHistory: {},
  projectBrowser: projectBrowserState,
  editor: editorState,
  debugger: debuggerState,
  errors: {},
  processes: {},
  lastSavedProject: projectState,
};
