import { expect } from 'chai';

import path from 'path';
import * as Loader from '../src/load';
import unpacked from './fixtures/unpacked.json';

const tempDir = './fs-temp';

describe('Loader', () => {
  const workspace = path.resolve(__dirname, tempDir, 'workspace');
  const projectPath = 'awesome_project';

  it('should return an array of projects in workspace', (done) => {
    Loader.getProjects(workspace)
      .then(projects => {
        expect(projects).to.have.lengthOf(1);
        expect(projects).to.deep.equal([
          {
            meta: {
              name: 'Awesome project',
              author: 'Amperka team',
            },
            libs: ['xod/core'],
            path: path.resolve(workspace, projectPath),
          },
        ]);
        done();
      })
      .catch(done);
  });

  it('should load whole project and pack it', (done) => {
    Loader.loadProject(projectPath, workspace)
      .then(project => {
        expect(project).to.deep.equal(unpacked);
        done();
      })
      .catch(done);
  });
});
