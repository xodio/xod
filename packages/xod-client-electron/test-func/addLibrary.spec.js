import fse from 'fs-extra';
import path from 'path';

import { assert } from 'chai';

import prepareSuite from './prepare';

import { TRIGGER_MAIN_MENU_ITEM } from '../src/testUtils/triggerMainMenu';

describe('Add library in the IDE', () => {
  const ide = prepareSuite();
  const wsPath = (...extraPath) => path.resolve(ide.tmpHomeDir, 'xod', ...extraPath);

  it('opens an "Add Library" suggester', () =>
    ide.app.electron.ipcRenderer.emit(TRIGGER_MAIN_MENU_ITEM, ['File', 'Add Library'])
      .then(() => ide.page.assertLibSuggesterShown())
  );

  it('searches for nonexistent library', () =>
    ide.page.findLibSuggester().setValue('input', 'xod/nonexistent-library')
      .then(ide.page.assertLibsNotFound)
  );

  it('searches for existing library', () =>
    ide.page.findLibSuggester().setValue('input', 'xod/core@0.11.0')
      .then(ide.page.assertLibraryFound)
  );

  it('double clicks on found library to install', () =>
    ide.page.installLibrary()
      .then(() => Promise.all([
        ide.page.assertLibSuggesterHidden(),
        ide.page.assertProjectBrowserHasInstallingLib('xod/core'),
      ]))
  );

  it('checks that installed xod/core have not `concat-4` node', () =>
    ide.page.waitUntilLibraryInstalled()
      .then(() => ide.page.findPatchGroup('xod/core').click())
      .then(() => ide.page.assertNodeUnavailableInProjectBrowser('concat-4'))
  );

  it('checks that library installed on the FS', () =>
    assert.eventually.isTrue(
      fse.pathExists(wsPath('__lib__', 'xod/core'))
    )
  );

  it('checks that library is on version 0.11.0', () =>
    assert.eventually.equal(
      fse.readJSON(wsPath('__lib__', 'xod/core', 'project.xod'))
        .then(proj => proj.version),
      '0.11.0'
    )
  );
});
