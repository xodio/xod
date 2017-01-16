import { expect } from 'chai';

import path from 'path';
import * as Loader from '../src/load';
import pack from '../src/pack';

import { expectEqualToXodball } from './utils';
import unpacked from './fixtures/unpacked.json';
import xodball from './fixtures/xodball.json';
import libsFixture from './fixtures/libs.json';

const tempDir = './fixtures/workspace';

describe('Loader', () => {
  const workspace = path.resolve(__dirname, tempDir);
  const projectPath = 'awesome_project';

  it('should return an array of projects in workspace', (done) => {
    Loader.getProjects(workspace)
      .then((projects) => {
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

  it('should load whole project, libs and pack it', (done) => {
    Loader.loadProjectWithLibs(projectPath, workspace)
      .then(({ project, libs }) => {
        expect(project).to.deep.include.members(unpacked);
        expect(libs).to.deep.equal(libsFixture);

        const packed = pack(project, libs);
        expectEqualToXodball(packed, xodball, expect);
        done();
      })
      .catch(done);
  });
});
