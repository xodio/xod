import chai from 'chai';
import initialState from '../src/client/app-browser/state';

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

  describe('should have in patches:', () => {
    it('at least one patch', () => {
      chai.expect(Object.keys(initialState.project.patches)).to.have.length.above(0);
    });
    it('nodes', () => {
      const patchId = Object.keys(initialState.project.patches)[0];
      chai.expect(initialState.project.patches[patchId]).to.have.any.keys(['nodes']);
    });
    it('links', () => {
      const patchId = Object.keys(initialState.project.patches)[0];
      chai.expect(initialState.project.patches[patchId]).to.have.any.keys(['links']);
    });
  });
});
