import * as Actions from '../../app/actions';
import { newId, links, lastId, copyLink } from '../../app/reducers/links';
import chai from 'chai';
import R from 'ramda';

describe('Links reducer', () => {
  const sharedLinkStore = {
    0: {
      id: 0,
      fromPinId: 0,
      toPinId: 1
    },
  };

  describe('while adding link', () => {
    let linkStore = null;
    beforeEach(
      () => {
        linkStore = R.clone(sharedLinkStore);
      }
    );

    it('should insert link', () => {
      const oldState = linkStore;
      const state = links(oldState, Actions.addLink({
        fromPinId: 2,
        toPinId: 3,
      }));
      chai.assert(newId(oldState) + 1 === newId(state));
    });

    it('should set appropriate id for a new node', () => {
      const state = links(linkStore, Actions.addLink({
        fromPinId: 2,
        toPinId: 3,
      }));
      const newLink = state[lastId(state)];
      chai.assert(newLink.id === lastId(state));
    });

    it('should be reverse operation for node deletion', () => {
      let state = null;
      state = links(linkStore, Actions.addLink({
        fromPinId: 2,
        toPinId: 3
      }));
      state = links(state, Actions.deleteLink(lastId(state)));
      chai.expect(state).to.deep.equal(linkStore);
    });
  });

  describe('while removing node', () => {
    let linkStore = null;
    beforeEach(
      () => {
        linkStore = R.clone(sharedLinkStore);
      }
    );

    it('should remove node', () => {
      const oldState = linkStore;
      const state = links(oldState, Actions.deleteLink(lastId(oldState)));

      chai.assert(lastId(oldState) - 1 === lastId(state));
    });

    it('should remove node with specified id', () => {
      const oldState = linkStore;
      const removingLinkId = lastId(oldState);
      const state = links(oldState, Actions.deleteLink(removingLinkId));

      chai.assert(!state.hasOwnProperty(removingLinkId));
    });

    it('should be reverse operation for node insertion', () => {
      let state = null;
      const RemovingLinkId = lastId(linkStore);
      const removingNode = copyLink(linkStore[RemovingLinkId]);
      state = links(linkStore, Actions.deleteLink(RemovingLinkId));
      state = links(state, Actions.addLink(removingNode));
      chai.expect(state).to.deep.equal(linkStore);
    });

    it('should not affect other nodes', () => {
      const oldState = linkStore;
      const removingLinkId = lastId(oldState);
      const state = links(oldState, Actions.deleteLink(removingLinkId));

      chai.assert(!state.hasOwnProperty(removingLinkId));
    });
  });
});
