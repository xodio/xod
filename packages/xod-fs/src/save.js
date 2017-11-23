import path from 'path';
import R from 'ramda';
import * as XP from 'xod-project';
import fse from 'fs-extra';
import { rejectWithCode, allPromises } from 'xod-func-tools';

import {
  resolvePath,
  expandHomeDir,
  isPatchFile,
  isProjectFile,
  resolveLibPath,
  doesDirectoryExist,
} from './utils';
import { writeFile, writeJSON } from './write';
import { Backup } from './backup';
import { arrangeByFiles, arrangePatchByFiles, fsSafeName, getProjectPath } from './unpack';
import {
  omitDefaultOptionsFromPatchFileContents,
  omitDefaultOptionsFromProjectFileContents,
} from './convertTypes';
import * as ERROR_CODES from './errorCodes';
import { CHANGE_TYPES } from './constants';
import { calculateDiff } from './patchDiff';

import { def } from './types';

// :: pathToWorkspace -> data -> Promise
const saveData = R.curry((pathToWorkspace, data) => new Promise((resolve, reject) => {
  const filePath = path.resolve(resolvePath(pathToWorkspace), data.path);
  // Decide how to write file, as JSON, or as string:
  const writeFn = (typeof data.content === 'string') ? writeFile : writeJSON;
  // Write
  return writeFn(filePath, data.content, data.encoding || 'utf8').then(resolve).catch(reject);
}));

// :: pathToWorkspace -> data -> Promise
export const saveArrangedFiles = R.curry((pathToWorkspace, data) => {
  let savingFiles = [];

  if (typeof data !== 'object') {
    throw Object.assign(
      new Error("Can't save project: wrong data format was passed into save function."),
      {
        path: resolvePath(pathToWorkspace),
        data,
      }
    );
  }
  const workspace = resolvePath(pathToWorkspace);
  const isArray = (data instanceof Array);
  const dataToSave = isArray ? data : [data];
  const projectDir = dataToSave[0].path.split(path.sep)[1];

  const pathToProject = expandHomeDir(path.resolve(workspace, projectDir));
  const pathToTemp = expandHomeDir(path.resolve(workspace, './.tmp/'));
  const backup = new Backup(pathToProject, pathToTemp);

  return backup.make()
    .then(() => {
      savingFiles = dataToSave.map(saveData(workspace));

      return Promise.all(savingFiles)
        .then(backup.clear)
        .catch(err => backup.restore()
          .then(() => Promise.reject(err))
        );
    });
});

// :: Path -> Project -> Promise Project Error
export const saveProjectEntirely = R.curry(
  (workspacePath, project) => Promise.resolve(project)
    .then(arrangeByFiles)
    .then(R.map(R.cond([
      [
        isPatchFile,
        R.over(R.lensProp('content'), omitDefaultOptionsFromPatchFileContents),
      ],
      [
        isProjectFile,
        R.over(R.lensProp('content'), omitDefaultOptionsFromProjectFileContents),
      ],
      [R.T, R.identity],
    ])))
    .then(saveArrangedFiles(workspacePath))
    .then(R.always(project))
    .catch(rejectWithCode(ERROR_CODES.CANT_SAVE_PROJECT))
);

// :: String -> Project -> Path -> Promise Project Error
export const saveLibraryEntirely = R.curry(
  (owner, project, workspacePath) => {
    const distPath = R.compose(
      libPath => path.resolve(libPath, fsSafeName(owner)),
      resolveLibPath
    )(workspacePath);

    return saveProjectEntirely(distPath, project)
      .catch(rejectWithCode(ERROR_CODES.CANT_SAVE_LIBRARY));
  }
);

// :: Path -> Map LibName Project -> Promise [Project] Error
export const saveAllLibrariesEntirely = R.uncurryN(2,
  workspacePath => R.compose(
    allPromises,
    R.values,
    R.mapObjIndexed((proj, name) => {
      const owner = XP.getOwnerName(name);
      return saveLibraryEntirely(owner, proj, workspacePath);
    })
  )
);

const savePatchChanges = def(
  'savePatchChanges :: Path -> [AnyPatchChange] -> Promise', // Promise Path Error
  (projectDir, patchChanges) => {
    const workspacePath = path.resolve(projectDir, '..');

    // delete patches :: [Promise]
    const deletePatches = R.compose(
      R.map(R.compose(
        fse.remove,
        patchName => path.resolve(projectDir, patchName),
        XP.getBaseName,
        R.prop('path')
      )),
      R.filter(R.compose(
        R.equals(CHANGE_TYPES.DELETED),
        R.prop('changeType')
      ))
    )(patchChanges);

    // add/modify patches :: Promise
    const addModifyPatches = R.compose(
      R.ifElse(
        R.isEmpty,
        () => Promise.resolve(),
        saveArrangedFiles(workspacePath)
      ),
      R.map(R.when(
        isPatchFile,
        R.over(R.lensProp('content'), omitDefaultOptionsFromPatchFileContents)
      )),
      R.unnest,
      R.map(R.compose(
        arrangePatchByFiles(projectDir),
        R.prop('data')
      )),
      R.reject(R.compose(
        R.equals(CHANGE_TYPES.DELETED),
        R.prop('changeType')
      ))
    )(patchChanges);

    return Promise.all(
      R.append(addModifyPatches, deletePatches)
    ).then(R.always(projectDir));
  }
);

export const saveProject = def(
  'saveProject :: Path -> [AnyPatchChange] -> Project -> Promise', // Promise Path Error
  (workspacePath, changes, project) => {
    const projectDir = path.resolve(workspacePath, getProjectPath(project));
    if (!doesDirectoryExist(projectDir)) {
      // save entire project
      return saveProjectEntirely(workspacePath, project);
    }

    // save only changes in the local patches
    return R.compose(
      localChanges => savePatchChanges(projectDir, localChanges),
      R.filter(R.compose(
        XP.isPathLocal,
        R.prop('path')
      ))
    )(changes);
  }
);

// :: Patch -> Patch
const convertLibPatchToLocalPatch = (patch) => {
  const patchPath = XP.getPatchPath(patch);
  const libName = XP.getLibraryName(patchPath);
  const libNameRegExp = new RegExp(`^(${libName})`);
  const newName = XP.convertToLocalPath(patchPath);

  const newNodes = R.compose(
    R.map(node => R.compose(
      XP.setNodeType(R.__, node),
      XP.convertToLocalPath,
      XP.getNodeType
    )(node)),
    R.filter(R.compose(
      R.test(libNameRegExp),
      XP.getNodeType
    )),
    XP.listNodes
  )(patch);

  return R.compose(
    XP.upsertNodes(newNodes),
    XP.setPatchPath(newName),
  )(patch);
};

export const saveLibraries = def(
  'saveLibraries :: Path -> [AnyPatchChange] -> Project -> Promise', // Promise [Path] Error
  (workspacePath, changes, project) => R.compose(
    allPromises,
    R.map((libName) => {
      const libDir = path.resolve(resolveLibPath(workspacePath), libName);
      const pureName = XP.getBaseName(libName);

      if (!doesDirectoryExist(libDir)) {
        // save entire library
        const owner = R.split('/', libName)[0];
        return R.compose(
          saveLibraryEntirely(owner, R.__, workspacePath),
          patches => R.compose(
            XP.assocPatchListUnsafe(
              R.map(convertLibPatchToLocalPatch, patches)
            ),
            XP.setProjectDescription(`My fork of "${libName}"`),
            XP.setProjectName(pureName),
            XP.createProject
          )(),
          R.filter(R.compose(
            R.equals(libName),
            XP.getLibraryName,
            XP.getPatchPath
          )),
          XP.listPatchesWithoutBuiltIns
        )(project);
      }

      // save only changes in the library
      return R.compose(
        libChanges => savePatchChanges(libDir, libChanges),
        R.map(R.when(
          R.has('data'),
          R.over(
            R.lensProp('data'),
            convertLibPatchToLocalPatch,
          )
        )),
        R.filter(R.compose(
          R.equals(libName),
          XP.getLibraryName,
          R.prop('path')
        ))
      )(changes);
    }),
    R.uniq,
    R.map(R.compose(
      XP.getLibraryName,
      R.prop('path')
    )),
    R.reject(R.compose(
      XP.isPathLocal,
      R.prop('path')
    ))
  )(changes)
);

export const saveAll = def(
  'saveAll :: Path -> Project -> Project -> Promise', // Promise Project Error
  (workspacePath, projectBefore, projectAfter) => {
    const changes = calculateDiff(
      XP.listPatchesWithoutBuiltIns(projectBefore),
      XP.listPatchesWithoutBuiltIns(projectAfter)
    );

    return Promise.all([
      saveProject(workspacePath, changes, projectAfter),
      saveLibraries(workspacePath, changes, projectAfter),
    ]).then(R.always(projectAfter));
  }
);
