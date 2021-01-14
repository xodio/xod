import R from 'ramda';
import fse from 'fs-extra';
import path from 'path';
import dircompare from 'dir-compare';
import { assert } from 'chai';

import prepareSuite from './prepare';

import {
  TRIGGER_MAIN_MENU_ITEM,
  TRIGGER_SAVE_AS,
  TRIGGER_LOAD_PROJECT,
} from '../src/testUtils/events';

const bundledWsPath = p => path.resolve(__dirname, '../../../workspace', p);

// :: PatchFileContents -> [NodeType]
const extractListOfUsedNodeTypes = R.compose(R.pluck('type'), R.prop('nodes'));

const getComparisonDiffs = R.compose(
  R.reject(R.propEq('state', 'equal')),
  R.prop('diffSet')
);

describe('Test FS things', () => {
  const ide = prepareSuite();

  it('IDE loaded and rendered', () => ide.page.rendered());

  it('opens welcome-to-xod project on first start', () =>
    ide.page.assertProjectIsOpened('welcome-to-xod'));

  describe('opening and saving blink project to disk', () => {
    it('opens blink project', () =>
      ide.app.electron.ipcRenderer
        .emit(TRIGGER_LOAD_PROJECT, bundledWsPath('blink/project.xod'))
        .then(() => ide.page.assertProjectIsOpened('blink')));

    const compareSavedWithFixture = () =>
      dircompare.compareSync(
        ide.wsPath('blink'),
        path.join(__dirname, '../src/workspace/blink'),
        {
          compareContent: true,
          excludeFilter:
            '.DS_Store,.directory,.Trash-*,Thumbs.db,desktop.ini,__fixtures__',
        }
      );

    const saveAsXodballAndCheck = () =>
      ide.app.electron.ipcRenderer
        .emit(TRIGGER_SAVE_AS, ide.wsPath('blink.xodball'))
        .then(ide.page.waitUntilProjectSaved)
        .then(() => {
          const expectedXodball = fse.readFileSync(
            path.join(
              __dirname,
              '../src/workspace/blink/__fixtures__/blink.xodball'
            ),
            'utf8'
          );
          const actualXodball = fse.readFileSync(
            ide.wsPath('blink.xodball'),
            'utf8'
          );
          assert.deepEqual(
            JSON.parse(actualXodball),
            JSON.parse(expectedXodball)
          );
        });

    // !!! Ideally, we should simulate clicking 'file -> save',
    // check that a file dialog appears and enter desired path there.
    // But spectron can't handle file dialogs :(
    it('saves blink project to disk as xodball', saveAsXodballAndCheck);
    it(
      'saves blink project to disk as xodball again and it remains the same',
      saveAsXodballAndCheck
    );

    it('saves blink project to disk', () =>
      ide.app.electron.ipcRenderer
        .emit(TRIGGER_SAVE_AS, ide.wsPath('blink'))
        .then(ide.page.waitUntilProjectSaved));

    it('is exaclty like bundled welcome project', () => {
      const comparison = compareSavedWithFixture();
      assert.deepEqual([], getComparisonDiffs(comparison));
    });

    it('saves a project for a second time without changing anything', () =>
      ide.app.electron.ipcRenderer
        .emit(TRIGGER_SAVE_AS, ide.wsPath('blink'))
        .then(ide.page.waitUntilProjectSaved));

    it('remains the same after saving for a second time', () => {
      const comparison = compareSavedWithFixture();
      assert.deepEqual([], getComparisonDiffs(comparison));
    });
  });

  // TODO: move most of this to xod-client-browser tests.
  describe('Add library in the IDE', () => {
    it('opens an "Add Library" suggester', () =>
      ide.app.electron.ipcRenderer
        .emit(TRIGGER_MAIN_MENU_ITEM, ['File', 'Add Library...'])
        .then(() => ide.page.assertLibSuggesterShown()));

    it('searches for a nonexistent library', async () => {
      const libSuggester = await ide.page.findLibSuggester();
      const input = await libSuggester.$('input');
      await input.setValue('xod/nonexisting-library');

      return ide.page.assertLibsNotFound();
    });

    it('searches for an existing library', async () => {
      await ide.app.client.keys(['Escape']); // get rid of previously entered values
      const libSuggester = await ide.page.findLibSuggester();
      const input = await libSuggester.$('input');
      await input.setValue('xod/core@0.11.0');

      return ide.page.assertLibraryFound();
    });

    it('double clicks on found library to install', async () => {
      await ide.page.installLibrary();
      await ide.page.waitUntilLibraryInstalled();
      return ide.page.assertLibSuggesterHidden();
    });

    it('checks that installed xod/core does not have `concat-4` node', async () => {
      await ide.page.expandPatchGroup('xod/core');
      return ide.page.assertNodeUnavailableInProjectBrowser('concat-4');
    });

    it('checks that library installed on the FS', () =>
      assert.eventually.isTrue(fse.pathExists(ide.libPath('xod/core'))));

    it('checks that library is on version 0.11.0', () =>
      assert.eventually.equal(
        fse
          .readJSON(ide.libPath('xod/core', 'project.xod'))
          .then(proj => proj.version),
        '0.11.0'
      ));
  });

  describe('Save all (project and libraries)', () => {
    let userCustomFileInLibPath;
    let userCustomFileInProject;

    before(() => {
      userCustomFileInLibPath = ide.libPath('xod/core/add/accounting.txt');
      userCustomFileInProject = ide.wsPath('blink/my-patch/note.txt');
    });

    // Prepare local project changes
    it('create new empty patch', async () => {
      await ide.page.clickAddPatch();
      await ide.page.setPopupValue('my-patch');
      await ide.page.confirmPopup();
      await ide.page.assertActiveTabHasTitle('my-patch');
      // TODO: if patch is empty — it is not saved!
      await ide.page.expandPatchGroup('xod/patch-nodes');
      await ide.page.scrollToPatchInProjectBrowser('input-string');
      await ide.page.selectPatchInProjectBrowser('input-string');
      await ide.page.clickAddNodeButton('input-string');
      return ide.page.expandPatchGroup('xod/patch-nodes');
    });

    it('delete another patch (`main`)', async () => {
      await ide.page.expandPatchGroup('blink');
      await ide.page.deletePatch('main');
      return ide.page.assertNodeUnavailableInProjectBrowser('main');
    });

    it('modify newly created patch (`my-patch`)', () =>
      ide.page
        .expandPatchGroup('blink')
        .then(() => ide.page.scrollToPatchInProjectBrowser('my-patch'))
        .then(() => ide.page.openPatchFromProjectBrowser('my-patch'))
        .then(() => ide.page.expandPatchGroup('xod/patch-nodes'))
        .then(() => ide.page.scrollToPatchInProjectBrowser('input-string'))
        .then(() => ide.page.selectPatchInProjectBrowser('input-string'))
        .then(() => ide.page.clickAddNodeButton('input-string'))
        .then(() => ide.page.expandPatchGroup('xod/patch-nodes')));

    it('put user file to the patch directory of the project', () =>
      fse
        .ensureFile(userCustomFileInProject)
        .then(() =>
          fse.writeFile(
            userCustomFileInProject,
            'My awesome note, that should not been deleted on project save!',
            'utf8'
          )
        ));

    // Prepare changes for already saved library (by installing lib)
    it('open library patch `xod/core/clock`', () =>
      ide.page
        .expandPatchGroup('xod/core')
        .then(() => ide.page.scrollToPatchInProjectBrowser('clock'))
        .then(() => ide.page.openPatchFromProjectBrowser('clock'))
        .then(() => ide.page.assertActiveTabHasTitle('clock')));

    it('add terminal node into patch of already saved library', () =>
      ide.page
        .expandPatchGroup('xod/patch-nodes')
        .then(() => ide.page.scrollToPatchInProjectBrowser('input-string'))
        .then(() => ide.page.selectPatchInProjectBrowser('input-string'))
        .then(() => ide.page.clickAddNodeButton('input-string'))
        .then(() =>
          assert.eventually.isTrue(ide.page.isNodeVisible('input-string'))
        ));

    it('put user file to the patch directory of already saved library', () =>
      fse.writeFile(
        userCustomFileInLibPath,
        'Better keep your accounting in safe place, dude',
        'utf8'
      ));

    // Prepare changes for unsaved library (bundled)
    it('add terminal node into patch of not saved yet library', () =>
      ide.page
        .expandPatchGroup('xod/units')
        .then(() => ide.page.assertPatchGroupExpanded('xod/units'))
        .then(() => ide.page.scrollToPatchInProjectBrowser('c-to-f'))
        .then(() => ide.page.openPatchFromProjectBrowser('c-to-f'))
        .then(() => ide.page.assertActiveTabHasTitle('c-to-f'))
        .then(() => ide.page.expandPatchGroup('xod/patch-nodes'))
        .then(() => ide.page.assertPatchGroupExpanded('xod/patch-nodes'))
        .then(() => ide.page.scrollToPatchInProjectBrowser('input-string'))
        .then(() => ide.page.selectPatchInProjectBrowser('input-string'))
        .then(() => ide.page.clickAddNodeButton('input-string'))
        .then(() =>
          assert.eventually.isTrue(ide.page.isNodeVisible('input-string'))
        ));

    // Calling Save Project and check all cases...
    it('call Save', () =>
      ide.app.electron.ipcRenderer
        .emit(TRIGGER_MAIN_MENU_ITEM, ['File', 'Save'])
        .then(ide.page.waitUntilProjectSaved));

    it('checks that saved only changes in the local project', () =>
      Promise.all([
        assert.eventually.isTrue(
          fse.pathExists(ide.wsPath('blink/my-patch/patch.xodp')),
          'Expected to `my-patch` be saved in the `blink` project, actually did not.'
        ),
        assert.eventually.isTrue(
          fse.pathExists(userCustomFileInProject),
          'Expected to keep user file in the patch, that was not changed.'
        ),
      ]));

    it('checks that saved only changed in the already saved library', () =>
      Promise.all([
        assert.eventually.sameMembers(
          fse
            .readJson(ide.libPath('xod/core/clock/patch.xodp'))
            .then(extractListOfUsedNodeTypes),
          [
            'xod/patch-nodes/input-number',
            'xod/patch-nodes/input-pulse',
            'xod/patch-nodes/not-implemented-in-xod',
            'xod/patch-nodes/output-pulse',
            'xod/patch-nodes/input-string', // new one
          ],
          'Expected to find edited `xod/core/clock`.'
        ),
        assert.eventually.isTrue(
          fse.pathExists(userCustomFileInLibPath),
          'Expected to keep accounting.txt in the same place, actually it was deleted.'
        ),
      ]));

    it("checks that saved entire library, cause it has changes but it haven't been saved yet", () =>
      Promise.all([
        assert.eventually.sameMembers(
          fse
            .readJson(ide.libPath('xod/units/c-to-f/patch.xodp'))
            .then(extractListOfUsedNodeTypes),
          [
            'xod/patch-nodes/input-number',
            'xod/math/map',
            'xod/patch-nodes/output-number',
            'xod/patch-nodes/input-string', // new one
          ],
          'Expected to find edited `xod/units/c-to-f`.'
        ),
        assert.eventually.isTrue(
          fse.pathExists(ide.libPath('xod/units/project.xod')),
          'Expected to save entire library.'
        ),
      ]));

    // Open project and make sure that libraries loaded from user workspace
    it('call Open Project', () =>
      ide.app.electron.ipcRenderer
        .emit(TRIGGER_LOAD_PROJECT, bundledWsPath('blink/project.xod'))
        .then(() => ide.page.assertProjectIsOpened('blink')));
    it('checks that `xod/core` loaded from User workspace by checking absense of `concat-4` patch', () =>
      ide.page
        .expandPatchGroup('xod/core')
        .then(() =>
          ide.page.assertNodeUnavailableInProjectBrowser('concat-4')
        ));
  });
});
