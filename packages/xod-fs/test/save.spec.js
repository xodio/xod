import R from 'ramda';
import { assert } from 'chai';
import { removeSync, readFile, readJson, pathExists } from 'fs-extra';
import path from 'path';
import * as XP from 'xod-project';

import { defaultizeProject, defaultizePatch } from 'xod-project/test/helpers';

import { calculateDiff } from '../src/patchDiff';
import {
  saveProjectEntirely,
  saveLibraryEntirely,
  saveAll,
  saveProject,
  saveLibraries,
} from '../src/save';
import * as ERROR_CODES from '../src/errorCodes';

import { resolveLibPath } from '../src/utils';

import { expectRejectedWithCode } from './utils';

const tempDirName = './fs-temp';
const tempDir = path.resolve(__dirname, tempDirName);
const tempProjectDir = path.resolve(__dirname, tempDirName, 'project');

describe('saveProjectEntirely()', () => {
  it('should reject CANT_SAVE_PROJECT', () =>
    expectRejectedWithCode(
      saveProjectEntirely(tempDir, {}),
      ERROR_CODES.CANT_SAVE_PROJECT
    )
  );
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
              content: '# Yay\n',
            },
          ],
        },
      },
    });

    return saveProjectEntirely(tempDir, testProject)
      .then(() => readFile(path.resolve(tempDir, 'test', 'img/20x20.png'), 'base64'))
      .then(content => assert.strictEqual(content, testProject.patches['@/test'].attachments[0].content))
      .then(() => readFile(path.resolve(tempDir, 'test', 'README.md'), 'utf8'))
      .then(content => assert.strictEqual(content, testProject.patches['@/test'].attachments[1].content));
  });
});

describe('saveLibraryEntirely()', () => {
  it('should reject CANT_SAVE_LIBRARY', () =>
    expectRejectedWithCode(
      saveLibraryEntirely('test', {}, tempDir),
      ERROR_CODES.CANT_SAVE_LIBRARY
    )
  );
});

describe('Save project and libraries', () => {
  afterEach(() => removeSync(tempDir));
  const projectName = 'test-project';

  const samePatch = defaultizePatch({});

  const emptyProject = defaultizeProject({
    name: projectName,
    patches: {},
  });
  const firstProject = defaultizeProject({
    name: projectName,
    patches: {
      '@/same': samePatch, // will be the same
      '@/edited': {}, // will be edited
      '@/deleted': {}, // will be deleted
      'xod/core/same': samePatch,  // will be the same
      'xod/core/edited': {}, // will be edited
      'xod/core/deleted': {}, // will be deleted
    },
  });
  const secondProject = defaultizeProject({
    name: projectName,
    patches: {
      '@/same': samePatch,
      '@/edited': { nodes: { a: { id: 'a', type: '@/same' } } },
      '@/added': {}, // will be added
      'xod/core/same': samePatch,
      'xod/core/edited': { nodes: { a: { id: 'a', type: 'xod/core/foo' } } },
      'xod/core/added': {}, // will be added
    },
  });

  const firstChanges = calculateDiff(
    XP.listPatchesWithoutBuiltIns(emptyProject),
    XP.listPatchesWithoutBuiltIns(firstProject)
  );
  const secondChanges = calculateDiff(
    XP.listPatchesWithoutBuiltIns(firstProject),
    XP.listPatchesWithoutBuiltIns(secondProject)
  );

  const assertPathExists = (...pathParts) => pathExists(path.resolve(...pathParts))
    .then(isExist => assert.isTrue(isExist, `Path "${pathParts}" does not exists.`));
  const libPath = (...extraPath) => path.resolve(resolveLibPath(tempDir), ...extraPath);

  const firstLocalExpectedFiles = [
    path.resolve(tempProjectDir, 'same/patch.xodp'),
    path.resolve(tempProjectDir, 'edited/patch.xodp'),
    path.resolve(tempProjectDir, 'deleted/patch.xodp'),
    path.resolve(tempProjectDir, 'project.xod'),
  ];
  const firstLibExpectedFiles = [
    libPath('xod/core/project.xod'),
    libPath('xod/core/same/patch.xodp'),
    libPath('xod/core/edited/patch.xodp'),
    libPath('xod/core/deleted/patch.xodp'),
  ];
  const secondLocalExpectedFiles = [
    path.resolve(tempProjectDir, 'same/patch.xodp'),
    path.resolve(tempProjectDir, 'edited/patch.xodp'),
    path.resolve(tempProjectDir, 'added/patch.xodp'),
    path.resolve(tempProjectDir, 'project.xod'),
  ];
  const secondLibExpectedFiles = [
    libPath('xod/core/project.xod'),
    libPath('xod/core/same/patch.xodp'),
    libPath('xod/core/edited/patch.xodp'),
    libPath('xod/core/added/patch.xodp'),
  ];

  describe('saveProject', () => {
    it('should save entire project if it wasn\'t saved yet', () =>
      saveProject(tempProjectDir, firstChanges, firstProject)
        .then(() => Promise.all(R.map(assertPathExists, firstLocalExpectedFiles)))
    );
    it('should save only changes in the project', () =>
      saveProject(tempProjectDir, firstChanges, firstProject) // make sure that project exists on FS
        .then(() => saveProject(tempProjectDir, secondChanges, secondProject))
        .then(() => Promise.all(R.map(assertPathExists, secondLocalExpectedFiles)))
    );
  });
  describe('saveLibraries', () => {
    it('should save entire library if it wasn\'t save yet', () =>
      saveLibraries(tempDir, firstChanges, firstProject)
        .then(() => Promise.all(R.map(assertPathExists, firstLibExpectedFiles)))
    );
    it('should save only changes in the library', () =>
      saveLibraries(tempDir, firstChanges, firstProject)
        .then(() => saveLibraries(tempDir, secondChanges, secondProject))
        .then(() => Promise.all(R.map(assertPathExists, secondLibExpectedFiles)))
        .then(() => readJson(libPath('xod/core/edited/patch.xodp'), 'utf8'))
        .then(content => assert.deepEqual(
          content,
          {
            nodes: [{
              id: 'a',
              position: { x: 0, y: 0 },
              type: '@/foo',
            }],
          }
        ))
    );
  });

  describe('saveAll', () => {
    it('should save entire project and library', () =>
      saveAll(tempDir, tempProjectDir, emptyProject, firstProject)
        .then(() => Promise.all(R.compose(
          R.map(assertPathExists),
          R.concat
        )(firstLocalExpectedFiles, firstLibExpectedFiles)))
    );
    it('should save only changes in project and library', () =>
      saveAll(tempDir, tempProjectDir, emptyProject, firstProject)
        .then(savedProject => saveAll(tempDir, tempProjectDir, savedProject, secondProject))
        .then(() => Promise.all(R.compose(
          R.map(assertPathExists),
          R.concat
        )(secondLocalExpectedFiles, secondLibExpectedFiles)))
    );
  });
});
