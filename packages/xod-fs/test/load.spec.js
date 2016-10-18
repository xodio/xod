import path from 'path';
import * as Loader from '../src/load';
import { pack } from 'xod-core';
import xodball from './fixtures/xodball.json';

const tempDir = './fs-temp';

describe('Loader', () => {
  const workspace = path.resolve(__dirname, tempDir, 'workspace');
  const projectName = xodball.meta.name;

  it('should return an array of projects in workspace', () => {
    const projects = Loader.getProjects(workspace);

    expect(projects).to.have.length.above(0);
  });

  it('should load whole project and pack it', () => {
    const project = Loader.loadProject(projectName, workspace);
    const projectPacked = pack(project);

    expect(projectPacked).to.deep.equal(xodball);
  });
});
