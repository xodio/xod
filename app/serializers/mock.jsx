import initialState from '../state';
import ViewStateGenerator from '../utils/ViewStateGenerator';

export default class {
  getState() {
    const viewstateGenerator = new ViewStateGenerator();
    const state = initialState.project;

    state.editor = initialState.editor;
    state.viewState = viewstateGenerator.create(state);

    return state;
  }
}