
import thunk from 'redux-thunk';
import { createStore, applyMiddleware } from 'redux';
import { default as chai, expect } from 'chai';
import dirtyChai from 'dirty-chai';

import Selectors from 'selectors';
import runtime from '!raw!xod-espruino/runtime';
import transpile from 'xod-espruino/transpiler';
import initialState from 'state';
import generateReducers from 'reducers';
import { addNode } from 'actions';

chai.use(dirtyChai);

describe('xod-espruino', () => {
  it('should transpile example initial state to kinda valid code', () => {
    const store = createStore(generateReducers([1]), initialState, applyMiddleware(thunk));
    store.dispatch(addNode(1, { x: 100, y: 100 }, 1));

    const projectJSON = Selectors.Project.getProjectJSON(store.getState());
    const project = JSON.parse(projectJSON);
    const code = transpile({ project, runtime });

    (() => {
      const mod = eval.call(null, code); // eslint-disable-line
      expect(project).to.exist();
      expect(nodes).to.exist();
      expect(topology).to.exist();
      expect(onInit).to.exist();

      expect(nodes).to.have.keys('1');
      expect(topology).to.be.eql([1]);
    })();
  });
});
