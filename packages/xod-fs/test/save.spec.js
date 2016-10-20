import { expect } from 'chai';

import fs from 'fs';
import path from 'path';
import recReadDir from 'recursive-readdir';
import rimraf from 'rimraf';

import save from '../src/save';
import { arrangeByFiles } from 'xod-core';
import xodball from './fixtures/xodball.json';

const tempDirName = './fs-temp';
const tempDir = path.resolve(__dirname, tempDirName);
const workspace = path.resolve(__dirname, tempDirName, 'workspace');

const onError = done => err => done(err);

describe('Saver', () => {
  before(() => {
    rimraf.sync(`${tempDir}/test.json`);
    rimraf.sync(workspace);
  });
  after(() => {
    rimraf.sync(tempDir);
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
