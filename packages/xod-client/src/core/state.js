import editorState from '../editor/state';
import projectState from '../project/state';


const initialState = {
  project: projectState,
  editor: editorState,
  errors: {},
  processes: {},
};

export default initialState;
