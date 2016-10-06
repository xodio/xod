import { expect } from 'chai';

import fs from 'fs';
import path from 'path';
import recReadDir from 'recursive-readdir';

import saver from '../src/fs/saver';
import { rmDir } from '../src/utils/fs';
import xodball from './mocks/xodball.json';
import { divided } from '../src/fs/extract';

const tempDir = './fs-temp';
const onError = done => err => done(err);

describe('Saver', () => {
  before(() => {
    const tmp = path.resolve(__dirname, tempDir);
    rmDir(tmp);
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

    saver(
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
    const dataToSave = divided(xodball);
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

    saver(
      dataToSave,
      workspace,
      onFinish,
      onError
    );
  });
});
