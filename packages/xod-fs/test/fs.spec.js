import { expect } from 'chai';

import fs from 'fs';
import path from 'path';
import recReadDir from 'recursive-readdir';
import rimraf from 'rimraf';

import save from '../src/save';
import * as Loader from '../src/load';
import { arrangeByFiles, pack } from 'xod-core';
import xodball from './mocks/xodball.json';

const tempDir = './fs-temp';
const onError = done => err => done(err);

describe('Saver', () => {
  before(() => {
    const tmp = path.resolve(__dirname, tempDir);
    rimraf.sync(tmp);
    fs.mkdirSync(tmp);
  });

  it('should save a test file in a temp directory', (done) => {
    const filePath = `${tempDir}/test.json`;

    const onFinish = () => {
      const result = JSON.parse(
        fs.readFileSync(
          path.resolve(__dirname, filePath),
          'utf8'
        )
      );
      expect(result).to.be.equal(true);
      done();
    };

    save(
      {
        path: filePath,
        content: true,
      },
      __dirname,
      onFinish,
      onError(done)
    );
  });

  it('should save an extracted project into temp directory', (done) => {
    const dataToSave = arrangeByFiles(xodball);
    const workspace = path.resolve(__dirname, tempDir, 'workspace');

    const onFinish = () => {
      try {
        recReadDir(workspace, ['.DS_Store'], (err, files) => {
          if (files.length === 5) {
            done();
          } else {
            throw new Error('Wrong amount of files (not equal 5). Check .xodball or change amount in the test!');
          }
        });
      } catch (err) {
        done(err);
      }
    };

    save(
      dataToSave,
      workspace,
      onFinish,
      onError
    );
  });
});

describe('Loader', () => {
  const workspace = path.resolve(__dirname, tempDir, 'workspace');

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
