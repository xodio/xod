import R from 'ramda';
import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import core from 'xod-core';
import initialState from '../src/core/state';
import { LINK_ERRORS } from '../src/messages/constants';

chai.use(dirtyChai);

describe('Link selector', () => {
  describe('while validating link creating', () => {
    function pin(nodeId, pinKey) {
      return { nodeId, pinKey };
    }
    const inputPin = {
      type: core.PIN_TYPE.NUMBER,
      direction: core.PIN_DIRECTION.INPUT,
    };
    const outputPin = {
      type: core.PIN_TYPE.NUMBER,
      direction: core.PIN_DIRECTION.OUTPUT,
    };

    const makeInputPin = R.flip(R.merge)(inputPin);
    const makeOutputPin = R.flip(R.merge)(outputPin);

    const state = {
      project: {
        nodeTypes: {
          'core/test': {
            id: 'core/test',
            pins: {
              inA: makeInputPin({ key: 'inA' }),
              inB: makeInputPin({ key: 'inB' }),
              outA: makeOutputPin({ key: 'outA' }),
              outB: makeOutputPin({ key: 'outB' }),
            },
          },
        },
        patches: {
          1: {
            id: '1',
            nodes: {
              1: { id: '1', typeId: 'core/test', position: { x: 100, y: 100 } },
              2: { id: '2', typeId: 'core/test', position: { x: 200, y: 200 } },
            },
            links: {
              100: { id: 100, pins: [pin('1', 'outB'), pin('2', 'inA')] },
            },
          },
        },
      },
      editor: {
        // FIXME: it should not be here. But now project selectors
        // are coupled with editor selectors o_O !! See issue #135.
        currentPatchId: '1',
      },
    };

    function validate(pinFrom, pinTo) {
      return core.validateLink(state, [pinFrom, pinTo]);
    }

    function expectOk(pinFrom, pinTo) {
      const check = validate(pinFrom, pinTo);
      expect(check).to.be.equal(null);
    }

    function expectFail(pinFrom, pinTo, message) {
      const check = validate(pinFrom, pinTo);
      expect(LINK_ERRORS[check]).to.be.equal(message);
    }

    it('should be valid', () => {
      expectOk(pin('1', 'outA'), pin('2', 'inB'));
      expectOk(pin('1', 'inB'), pin('2', 'outB'));
      expectOk(pin('2', 'outA'), pin('1', 'inB'));
      expectOk(pin('2', 'inB'), pin('1', 'outB'));
    });

    it('should be invalid to link same node', () => {
      expectFail(pin('1', 'outA'), pin('1', 'inA'), LINK_ERRORS.SAME_NODE);
    });

    it('should be invalid to link same direction', () => {
      expectFail(pin('1', 'outA'), pin('2', 'outA'), LINK_ERRORS.SAME_DIRECTION);
      expectFail(pin('2', 'outB'), pin('1', 'outA'), LINK_ERRORS.SAME_DIRECTION);
    });

    it('should be invalid to have multiple inbound links', () => {
      expectFail(pin('1', 'outA'), pin('2', 'inA'), LINK_ERRORS.ONE_LINK_FOR_INPUT_PIN);
    });
  });
});

describe('Project selector', () => {
  let state = null;
  beforeEach(
    () => {
      state = R.clone(initialState);
    }
  );

  it('should return valid JSON', () => {
    const json = JSON.parse(core.getProjectJSON(state));
    chai.assert(core.validateProject(json));
  });
});
