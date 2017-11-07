import { assert } from 'chai';

import { removeSync, readFile } from 'fs-extra';
import path from 'path';
import { defaultizeProject } from 'xod-project/test/helpers';

import { getImplFilenameByType } from '../src/utils';
import { saveProject } from '../src/save';
import * as ERROR_CODES from '../src/errorCodes';

import { expectRejectedWithCode } from './utils';

const tempDirName = './fs-temp';
const tempDir = path.resolve(__dirname, tempDirName);

describe('saveProject', () => {
  after(() => removeSync(tempDir));

  it('should reject CANT_SAVE_PROJECT', () =>
    expectRejectedWithCode(
      saveProject(tempDir, {}),
      ERROR_CODES.CANT_SAVE_PROJECT
    ));
  it('should save patch implementations correctly', () => {
    const projectName = 'impls-test';
    const implContent =
      '// hey-ho\n// it should be a normal file\n// not a stringified JSON\n';
    const implContentExpected = [
      '// hey-ho',
      '// it should be a normal file',
      '// not a stringified JSON',
      '',
    ].join('\n');
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
      .then(() =>
        readFile(
          path.resolve(
            tempDir,
            projectName,
            'test',
            getImplFilenameByType('js')
          ),
          'utf8'
        )
      )
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
              content:
                'iVBORw0KGgoAAAANSUhEUgAAABQAAAAUBAMAAAB/pwA+AAAAG1BMVEXMzMyWlpaxsbGqqqq3t7fFxcWjo6OcnJy+vr5AT8FzAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAMElEQVQImWNgoBFQVkmBka7i4QxQklmRkUGlAUQyqLCHM4SBSYYkoCqVhiSwDioCAPhiB33L/sGeAAAAAElFTkSuQmCC',
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

    return saveProject(tempDir, testProject)
      .then(() =>
        readFile(
          path.resolve(tempDir, projectName, 'test', 'img/20x20.png'),
          'base64'
        )
      )
      .then(content =>
        assert.strictEqual(
          content,
          testProject.patches['@/test'].attachments[0].content
        )
      )
      .then(() =>
        readFile(
          path.resolve(tempDir, projectName, 'test', 'README.md'),
          'utf8'
        )
      )
      .then(content =>
        assert.strictEqual(
          content,
          testProject.patches['@/test'].attachments[1].content
        )
      );
  });
});
