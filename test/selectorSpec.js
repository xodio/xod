import R from 'ramda';
import chai from 'chai';
import initialState from '../app/state';
import Selectors from '../app/selectors';
import * as PIN_TYPE from '../app/constants/pinType';
import * as PIN_DIRECTION from '../app/constants/pinDirection';
import { LINK_ERRORS } from '../app/constants/errorMessages';

describe('Link selector', () => {
  describe('while validating link creating', () => {
    function pin(nodeId, pinKey) {
      return { nodeId, pinKey };
    }

    const state = {
      project: {
        nodeTypes: {
          'core/test': {
            key: 'core/test',
            pins: {
              inA: { key: 'inA', type: PIN_TYPE.NUMBER, direction: PIN_DIRECTION.INPUT },
              inB: { key: 'inB', type: PIN_TYPE.NUMBER, direction: PIN_DIRECTION.INPUT },
              outA: { key: 'outA', type: PIN_TYPE.NUMBER, direction: PIN_DIRECTION.OUTPUT },
              outB: { key: 'outB', type: PIN_TYPE.NUMBER, direction: PIN_DIRECTION.OUTPUT },
            },
          },
        },
        patches: {
          1: {
            id: 1,
            nodes: {
              1: { id: 1, typeId: 'core/test', position: { x: 100, y: 100 } },
              2: { id: 2, typeId: 'core/test', position: { x: 200, y: 200 } },
            },
            links: {
              100: { id: 100, pins: [pin(1, 'outB'), pin(2, 'inA')] },
            },
          },
        },
      },
      editor: {
        // FIXME: it should not be here. But now project selectors
        // are coupled with editor selectors o_O !! See issue #135.
        currentPatchId: 1,
      },
    };

    function validate(pinFrom, pinTo) {
      return Selectors.Editor.validateLink(state, [pinFrom, pinTo]);
    }

    function expectOk(pinFrom, pinTo) {
      const check = validate(pinFrom, pinTo);
      chai.expect(check.isValid).to.be.equal(true);
    }

    function expectFail(pinFrom, pinTo, message) {
      const check = validate(pinFrom, pinTo);
      chai.expect(check.isValid).to.be.equal(false);
      chai.expect(check.message).to.be.equal(message);
    }

    it('should be valid', () => {
      expectOk(pin(1, 'outA'), pin(2, 'inB'));
      expectOk(pin(1, 'inB'), pin(2, 'outB'));
      expectOk(pin(2, 'outA'), pin(1, 'inB'));
      expectOk(pin(2, 'inB'), pin(1, 'outB'));
    });

    it('should be invalid to link same node', () => {
      expectFail(pin(1, 'outA'), pin(1, 'inA'), LINK_ERRORS.SAME_NODE);
    });

    it('should be invalid to link same direction', () => {
      expectFail(pin(1, 'outA'), pin(2, 'outA'), LINK_ERRORS.SAME_DIRECTION);
      expectFail(pin(2, 'outB'), pin(1, 'outA'), LINK_ERRORS.SAME_DIRECTION);
    });

    it('should be invalid to have multiple inbound links', () => {
      expectFail(pin(1, 'outA'), pin(2, 'inA'), LINK_ERRORS.ONE_LINK_FOR_INPUT_PIN);
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
    const json = JSON.parse(Selectors.Project.getProjectJSON(state));
    chai.assert(Selectors.Project.validateProject(json));
  });
});
