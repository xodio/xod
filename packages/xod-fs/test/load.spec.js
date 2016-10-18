import { expect } from 'chai';

import path from 'path';
import * as Loader from '../src/load';
import loadLibs from '../src/loadLibs';
import { pack } from 'xod-core';
import unpacked from './fixtures/unpacked.json';
import xodball from './fixtures/xodball.json';

const tempDir = './fs-temp';
const libDir = './fixtures';

describe('Loader', () => {
  const workspace = path.resolve(__dirname, tempDir, 'workspace');
  const libPath = path.resolve(__dirname, libDir);
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

  it('should load whole project data that ready to be passed into xod-core/pack', (done) => {
    Loader.loadProject(projectPath, workspace)
      .then(project => {
        expect(project).to.deep.equal(unpacked);
        done();
      })
      .catch(done);
  });

  it('should load whole project, libs and pack it', (done) => {
    Loader.loadProject(projectPath, workspace)
      .then(project => new Promise(resolve => {
        loadLibs(project[0].content.libs, libPath)
          .then(libs => {
            resolve({
              project,
              libs,
            });
          });
      }))
      .then(({ project, libs }) => {
        const packed = pack(project, libs);

        expect(packed).to.deep.equal(xodball);
        done();
      })
      .catch(done);
  });
});
