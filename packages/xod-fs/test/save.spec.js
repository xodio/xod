import { expect } from 'chai';

import fs from 'fs';
import { removeSync } from 'fs-extra';
import path from 'path';
import recReadDir from 'recursive-readdir';

import save from '../src/save';
import { arrangeByFiles } from '../src/unpack';
import xodball from './fixtures/xodball.json';

const tempDirName = './fs-temp';
const tempDir = path.resolve(__dirname, tempDirName);
const workspace = `${tempDirName}/workspace`;
const workspacePath = path.resolve(__dirname, workspace);

const onError = done => err => done(err);

describe('Saver', () => {
  before(() => {
    removeSync(`${tempDir}/test.json`);
    removeSync(workspacePath);
  });
  after(() => {
    removeSync(tempDir);
  });

  it('should save a test file in a temp directory', (done) => {
    const filePath = `${tempDirName}/test/test.json`;
    const testData = {
      path: filePath,
      content: true,
    };

    save(__dirname, testData)
      .then(() => {
        const result = JSON.parse(
          fs.readFileSync(
            path.resolve(__dirname, filePath),
            'utf8'
          )
        );
        expect(result).to.be.equal(true);
        done();
      })
      .catch(onError(done));
  });

  it('should save an extracted project into temp directory', (done) => {
    const dataToSave = arrangeByFiles(xodball);

    const onFinish = () => {
      try {
        recReadDir(workspacePath, ['.DS_Store'], (err, files) => {
          if (files.length === 3) {
            done();
          } else {
            throw new Error('Wrong amount of files (not equal 5). Check .xodball or change amount in the test!');
          }
        });
      } catch (err) {
        done(err);
      }
    };

    save(workspacePath, dataToSave)
      .then(onFinish)
      .catch(onError(done));
  });
});
