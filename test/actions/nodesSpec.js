import chai from 'chai';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import * as Actions from '../../app/actions';
import * as ActionType from '../../app/actionTypes';

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

describe('Node deleting with dependecies', () => {
  const mockState = {
    project: {
      nodes: {
        1: {
          id: 1,
        },
        2: {
          id: 2,
        },
      },
      pins: {
        1: {
          id: 1,
          nodeId: 1,
        },
        2: {
          id: 2,
          nodeId: 1,
        },
        3: {
          id: 3,
          nodeId: 2,
        },
      },
      links: {
        1: {
          id: 1,
          fromPinId: 2,
          toPinId: 3,
        },
      },
    },
  };

  let store;
  beforeEach(() => {
    store = mockStore(mockState);
  });

  it('should delete node, children pins and link', () => {
    const expectedActions = [
      { type: ActionType.LINK_DELETE, payload: { id: 1 } },
      { type: ActionType.PIN_DELETE, payload: { id: 1 } },
      { type: ActionType.PIN_DELETE, payload: { id: 2 } },
      { type: ActionType.NODE_DELETE, payload: { id: 1 } },
    ];

    store.dispatch(Actions.deleteNodeWithDependencies(1));

    chai.expect(store.getActions()).to.deep.equal(expectedActions);
  });
});
