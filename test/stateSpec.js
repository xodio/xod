import chai from 'chai';
import initialState from '../app/state';

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

  describe('should have reducers inside project:', () => {
    it('nodes', () => {
      chai.expect(initialState.project).to.have.any.keys(['nodes']);
    });
    it('pins', () => {
      chai.expect(initialState.project).to.have.any.keys(['pins']);
    });
    it('links', () => {
      chai.expect(initialState.project).to.have.any.keys(['links']);
    });
    it('nodeTypes', () => {
      chai.expect(initialState.project).to.have.any.keys(['nodeTypes']);
    });
    it('meta', () => {
      chai.expect(initialState.project).to.have.any.keys(['meta']);
    });
    it('patches', () => {
      chai.expect(initialState.project).to.have.any.keys(['patches']);
    });
  });
});
