import R from 'ramda';
import chai from 'chai';
import initialState from '../app/state';
import Selectors from '../app/selectors';
import * as PIN_TYPE from '../app/constants/pinType';
import * as PIN_DIRECTION from '../app/constants/pinDirection';
import { LINK_ERRORS } from '../app/constants/errorMessages';

describe('Link selector', () => {
  describe('while validating link creating', () => {
    const state = {
      project: {
        nodeTypes: {
          42: {
            id: 42,
            pins: {
              inA: { key: 'inA', type: PIN_TYPE.NUMBER, direction: PIN_DIRECTION.INPUT },
              inB: { key: 'inB', type: PIN_TYPE.NUMBER, direction: PIN_DIRECTION.INPUT },
              outA: { key: 'outA', type: PIN_TYPE.NUMBER, direction: PIN_DIRECTION.OUTPUT },
              outB: { key: 'outB', type: PIN_TYPE.NUMBER, direction: PIN_DIRECTION.OUTPUT },
            }
          }
        },
        patches: {
          1: {
            id: 1,
            nodes: {
              1: { id: 1, typeId: 42, position: { x: 100, y: 100 } },
              2: { id: 2, typeId: 42, position: { x: 200, y: 200 } },
            },
            pins: {
              11: { id: 11, nodeId: 1, key: 'inA' },
              12: { id: 12, nodeId: 1, key: 'inB' },
              13: { id: 13, nodeId: 1, key: 'outA' },
              14: { id: 14, nodeId: 1, key: 'outB' },
              21: { id: 21, nodeId: 2, key: 'inA' },
              22: { id: 22, nodeId: 2, key: 'inB' },
              23: { id: 23, nodeId: 2, key: 'outA' },
              24: { id: 24, nodeId: 2, key: 'outB' },
            },
            links: {
              100: { id: 100, pins: [14, 21] },
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
      return Selectors.Project.validateLink(state, [pinFrom, pinTo]);
    }

    function expectOk(pinFrom, pinTo) {
      const check = validate(pinFrom, pinTo);
      chai.expect(check.isValid).to.be.true;
    }

    function expectFail(pinFrom, pinTo, message) {
      const check = validate(pinFrom, pinTo);
      chai.expect(check.isValid).to.be.false;
      chai.expect(check.message).to.be.equal(message);
    }

    it('should be valid', () => {
      expectOk(14, 22);
      expectOk(13, 22);
      expectOk(23, 11);
      expectOk(24, 11);
      expectOk(23, 12);
      expectOk(24, 12);
    });

    it(`should be invalid to link same node`, () => {
      expectFail(14, 11, LINK_ERRORS.SAME_NODE);
    });

    it(`should be invalid to link same direction`, () => {
      expectFail(14, 24, LINK_ERRORS.SAME_DIRECTION);
      expectFail(12, 22, LINK_ERRORS.SAME_DIRECTION);
    });

    it(`should be invalid to have multiple inbound links`, () => {
      expectFail(13, 21, LINK_ERRORS.ONE_LINK_FOR_INPUT_PIN);
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
