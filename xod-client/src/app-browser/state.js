import editorState from 'xod-client/editor/state';
import projectState from 'xod-client/project/state';


const initialState = {
  project: projectState,
  editor: editorState,
  errors: {},
  processes: {},
};

export default initialState;
