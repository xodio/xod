import editorState from '../editor/state';
import projectState from '../project/state';
import projectBrowserState from '../projectBrowser/state';


const initialState = {
  project: projectState,
  projectBrowser: projectBrowserState,
  editor: editorState,
  errors: {},
  processes: {},
};

export default initialState;
