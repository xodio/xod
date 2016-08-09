
import thunk from 'redux-thunk';
import { createStore, applyMiddleware } from 'redux';
import { expect } from 'chai';

import Selectors from 'selectors';
import transpile from 'xod-espruino/transpiler';
import initialState from 'state';
import generateReducers from 'reducers';
import { addNode } from 'actions';

describe('xod-espruino', () => {
  it('should transpile example initial state to kinda valid code', () => {
    const store = createStore(generateReducers([1]), initialState, applyMiddleware(thunk));
    store.dispatch(addNode(1, { x: 100, y: 100 }, 1));

    const projectJSON = Selectors.Project.getProjectJSON(store.getState());
    const project = JSON.parse(projectJSON);
    const code = transpile({ project, runtime: 'BlaBlaBla;' });
    expect(code).to.match(/var nodes = {.+};/);
    expect(code).to.match(/BlaBlaBla/);
  });
});
