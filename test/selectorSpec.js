import R from 'ramda';
import chai from 'chai';
import initialState from '../app/state';
import Selectors from '../app/selectors';
import { LINK_ERRORS } from '../app/constants/errorMessages';

describe('Link selector', () => {
  describe('while validating link creating', () => {
    let state = null;
    beforeEach(
      () => {
        state = R.clone(initialState);
      }
    );

    it('should be valid', () => {
      const pins = [2, 8];
      const check = Selectors.Project.validateLink.bind(null, state, pins);

      chai.expect(check().isValid).to.equal(true);
    });

    it(`should be invalid with error: ${LINK_ERRORS.SAME_NODE}`, () => {
      const pins = [2, 3];
      const check = Selectors.Project.validateLink.bind(null, state, pins);
      const message = LINK_ERRORS.SAME_NODE;

      chai.expect(check().message).to.be.equal(message);
    });

    it(`should be invalid with error: ${LINK_ERRORS.SAME_DIRECTION}`, () => {
      const pins = [2, 7];
      const check = Selectors.Project.validateLink.bind(null, state, pins);
      const message = LINK_ERRORS.SAME_DIRECTION;

      chai.expect(check().message).to.be.equal(message);
    });

    it(`should be invalid with error: ${LINK_ERRORS.ONE_LINK_FOR_INPUT_PIN}`, () => {
      const pins = [3, 6];
      const check = Selectors.Project.validateLink.bind(null, state, pins);
      const message = LINK_ERRORS.ONE_LINK_FOR_INPUT_PIN;

      chai.expect(check().message).to.be.equal(message);
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
