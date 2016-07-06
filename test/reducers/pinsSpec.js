import * as Actions from '../../app/actions';
import { pins, getLastId, getNewId } from '../../app/reducers/pins';
import chai from 'chai';
import R from 'ramda';

describe('Pins reducer', () => {
  const mockState = {
    0: {
      id: 0,
      nodeId: 0,
      key: 'in',
    },
  };

  describe('while adding pin', () => {
    let store = null;
    beforeEach(
      () => {
        store = R.clone(mockState);
      }
    );

    it('should insert pin', () => {
      const oldState = store;
      const state = pins(oldState, Actions.addPin(0, 'in'));
      chai.assert(getNewId(oldState) + 1 === getNewId(state));
    });

    it('should set appropriate id for a new pin', () => {
      const state = pins(store, Actions.addPin(0, 'in'));
      const newPin = state[getLastId(state)];
      chai.assert(newPin.id === getLastId(state));
    });

    it('should be reverse operation for pin deletion', () => {
      let state = null;
      state = pins(store, Actions.addPin(0, 'in'));
      state = pins(state, Actions.deletePin(getLastId(state)));
      chai.expect(state).to.deep.equal(store);
    });
  });

  describe('while removing pin', () => {
    let store = null;
    beforeEach(
      () => {
        store = R.clone(mockState);
      }
    );

    it('should remove pin', () => {
      const oldState = store;
      const state = pins(oldState, Actions.deletePin(getLastId(oldState)));

      chai.assert(getLastId(oldState) - 1 === getLastId(state));
    });

    it('should remove pin with specified id', () => {
      const oldState = store;
      const removingPinId = getLastId(oldState);
      const state = pins(oldState, Actions.deletePin(removingPinId));

      chai.assert(!state.hasOwnProperty(removingPinId));
    });

    it('should be reverse operation for pin insertion', () => {
      let state = null;
      const removingPinId = getLastId(store);
      state = pins(store, Actions.deletePin(removingPinId));
      state = pins(state, Actions.addPin(0, 'in'));
      chai.expect(state).to.deep.equal(store);
    });

    it('should not affect other pins', () => {
      const oldState = store;
      const removingPinId = getLastId(oldState);
      const state = pins(oldState, Actions.deletePin(removingPinId));

      chai.assert(!state.hasOwnProperty(removingPinId));
    });
  });
});
