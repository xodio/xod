import { assert, expect } from 'chai';

import fs from 'fs';
import { removeSync, readFile } from 'fs-extra';
import path from 'path';
import recReadDir from 'recursive-readdir';
import { defaultizeProject } from 'xod-project/test/helpers';

import { getImplFilenameByType } from '../src/utils';
import { saveArrangedFiles, saveProject } from '../src/save';
import { arrangeByFiles } from '../src/unpack';
import * as ERROR_CODES from '../src/errorCodes';

import project from './fixtures/project.json';
import { expectRejectedWithCode } from './utils';

const tempDirName = './fs-temp';
const tempDir = path.resolve(__dirname, tempDirName);
const workspace = `${tempDirName}/workspace`;
const workspacePath = path.resolve(__dirname, workspace);

const onError = done => err => done(err);

describe('saveArrangedFiles', () => {
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

    saveArrangedFiles(__dirname, testData)
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
    const dataToSave = arrangeByFiles(project);
    const expectedFilesNumber = 7;

    const onFinish = () => {
      try {
        recReadDir(workspacePath, ['.DS_Store', 'Thumbs.db'], (err, files) => {
          if (files.length === expectedFilesNumber) {
            done();
          } else {
            throw new Error(`Wrong amount of files (not equal ${expectedFilesNumber}). Check .project or change amount in the test!`);
          }
        });
      } catch (err) {
        done(err);
      }
    };

    saveArrangedFiles(workspacePath, dataToSave)
      .then(onFinish)
      .catch(onError(done));
  });
});

describe('saveProject', () => {
  after(() => removeSync(tempDir));

  it('should save project and return resolve project', () =>
    saveProject(tempDir, project).then(
      p => assert.equal(project, p)
    )
  );
  it('should reject CANT_SAVE_PROJECT', () =>
    expectRejectedWithCode(
      saveProject(tempDir, {}),
      ERROR_CODES.CANT_SAVE_PROJECT
    )
  );
  it('should save patch implementations correctly', () => {
    const projectName = 'impls-test';
    const implContent = '\n      // hey-ho\n      // it should be a normal file\n      // not a stringified JSON\n    ';
    const implContentExpected = `
      // hey-ho
      // it should be a normal file
      // not a stringified JSON
    `;
    const proj = defaultizeProject({
      name: projectName,
      patches: {
        '@/test': {
          impls: {
            js: implContent,
          },
        },
      },
    });

    return saveProject(tempDir, proj)
      .then(() => readFile(path.resolve(tempDir, projectName, 'test', getImplFilenameByType('js')), 'utf8'))
      .then(content => assert.strictEqual(content, implContentExpected));
  });
  it('should save patch attachments correctly', () => {
    const projectName = 'attachment-test';
    const testProject = defaultizeProject({
      name: projectName,
      patches: {
        '@/test': {
          attachments: [
            {
              filename: 'img/20x20.png',
              encoding: 'base64',
              content: 'iVBORw0KGgoAAAANSUhEUgAAABQAAAAUBAMAAAB/pwA+AAAAG1BMVEXMzMyWlpaxsbGqqqq3t7fFxcWjo6OcnJy+vr5AT8FzAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAMElEQVQImWNgoBFQVkmBka7i4QxQklmRkUGlAUQyqLCHM4SBSYYkoCqVhiSwDioCAPhiB33L/sGeAAAAAElFTkSuQmCC',
            },
            {
              filename: 'README.md',
              encoding: 'utf8',
              content: '# Yay',
            },
          ],
        },
      },
    });

    return saveProject(tempDir, testProject)
      .then(() => readFile(path.resolve(tempDir, projectName, 'test', 'img/20x20.png'), 'base64'))
      .then(content => assert.strictEqual(content, testProject.patches['@/test'].attachments[0].content))
      .then(() => readFile(path.resolve(tempDir, projectName, 'test', 'README.md'), 'utf8'))
      .then(content => assert.strictEqual(content, testProject.patches['@/test'].attachments[1].content));
  });
});
