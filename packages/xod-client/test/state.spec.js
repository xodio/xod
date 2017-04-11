import chai from 'chai';
import initialState from '../src/core/state';

describe('Initial state', () => {
  describe('should have reducers:', () => {
    it('project', () => {
      chai.expect(initialState).to.have.any.keys(['project']);
    });
    it('editor', () => {
      chai.expect(initialState).to.have.any.keys(['editor']);
    });
    it('errors', () => {
      chai.expect(initialState).to.have.any.keys(['errors']);
    });
  });
});
