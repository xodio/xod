import os from 'os';
import path from 'path';
import * as R from 'ramda';
import * as XP from 'xod-project';
import fse from 'fs-extra';
import { rejectWithCode, allPromises } from 'xod-func-tools';

import {
  resolvePath,
  isPatchFile,
  isProjectFile,
  resolveLibPath,
  doesDirectoryExist,
} from './utils';
import { writeFile, writeJSON } from './write';
import { Backup } from './backup';
import { arrangeByFiles, arrangePatchByFiles, fsSafeName } from './unpack';
import {
  convertProjectToProjectFileContents,
  omitDefaultOptionsFromPatchFileContents,
  omitDefaultOptionsFromProjectFileContents,
} from './convertTypes';
import * as ERROR_CODES from './errorCodes';
import { CHANGE_TYPES } from './constants';
import { calculateDiff } from './patchDiff';

import { def } from './types';

// :: Path -> AnyXodFile -> Promise AnyXodFile Error
const saveVirtualFile = R.curry((rootDir, virtualFile) => {
  const filePath = path.join(rootDir, virtualFile.path);
  // Decide how to write file, as JSON, or as string:
  const writeFn = (typeof virtualFile.content === 'string') ? writeFile : writeJSON;
  // Write
  return writeFn(filePath, virtualFile.content, virtualFile.encoding || 'utf8');
});

// :: Path -> (AnyXodFile | [AnyXodFile]) -> Promise
export const saveArrangedFiles = R.curry((rootDir, virtualFile) => {
  const realRootDir = resolvePath(rootDir);
  return fse.ensureDir(realRootDir).then(
    () => {
      if (typeof virtualFile !== 'object') {
        throw Object.assign(
          new Error("Can't save project: wrong data format was passed into save function."),
          {
            path: realRootDir,
            virtualFile,
          }
        );
      }

      const dataToSave = R.when(
        R.complement(Array.isArray),
        R.of
      )(virtualFile);
      const pathToTemp = path.resolve(os.tmpdir(), 'xod-temp');
      const backup = new Backup(realRootDir, pathToTemp);

      return backup.make()
        .then(() => Promise.all(
          dataToSave.map(saveVirtualFile(realRootDir))
        ))
        .then(backup.clear)
        .catch(err => backup.restore()
          .then(() => Promise.reject(err))
        );
    }
  );
});

// :: Path -> Project -> Promise Project Error
export const saveProjectEntirely = R.curry(
  (dirPath, project) => Promise.resolve(project)
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
    .then(saveArrangedFiles(dirPath))
    .then(R.always(project))
    .catch(rejectWithCode(ERROR_CODES.CANT_SAVE_PROJECT))
);

// :: String -> Project -> Path -> Promise Project Error
export const saveLibraryEntirely = R.curry(
  (owner, project, workspacePath) => Promise.resolve(workspacePath)
    .then(R.compose(
      libPath => path.resolve(
        libPath,
        fsSafeName(owner),
        fsSafeName(XP.getProjectName(project))
      ),
      resolveLibPath
    ))
    .then(dirPath => saveProjectEntirely(dirPath, project))
    .catch(rejectWithCode(ERROR_CODES.CANT_SAVE_LIBRARY))
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
    // delete patches :: Promise
    const deletePatches = R.compose(
      allPromises,
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
    );

    // add/modify patches :: Promise
    const addModifyPatches = R.compose(
      R.ifElse(
        R.isEmpty,
        () => Promise.resolve(),
        saveArrangedFiles(projectDir)
      ),
      R.map(R.when(
        isPatchFile,
        R.over(R.lensProp('content'), omitDefaultOptionsFromPatchFileContents)
      )),
      R.unnest,
      R.map(R.compose(
        arrangePatchByFiles,
        R.prop('data')
      )),
      R.reject(R.compose(
        R.equals(CHANGE_TYPES.DELETED),
        R.prop('changeType')
      ))
    );

    return addModifyPatches(patchChanges)
      .then(() => deletePatches(patchChanges))
      .then(R.always(projectDir));
  }
);

const saveProjectMeta = def(
  'saveProjectMeta :: Path -> Project -> Promise', // Promise Path Error
  (projectDir, project) => saveArrangedFiles(projectDir, [{
    path: path.join('.', 'project.xod'),
    content: R.compose(
      omitDefaultOptionsFromProjectFileContents,
      convertProjectToProjectFileContents
    )(project),
  }])
    .then(R.always(projectDir))
);

export const saveProjectAsXodball = def(
  'saveProjectAsXodball :: Path -> Project -> Promise', // Promise Path Error
  (projectPath, project) => {
    const projectDir = path.dirname(projectPath);
    return R.composeP(
      R.always(projectPath),
      virtualXodball => saveVirtualFile(projectDir, virtualXodball),
      content => ({
        path: path.basename(projectPath),
        content,
      }),
      XP.toXodball,
      Promise.resolve.bind(Promise)
    )(project);
  }
);

export const saveProject = def(
  'saveProject :: Path -> [AnyPatchChange] -> Project -> Promise', // Promise Path Error
  (projectPath, changes, project) => {
    if (/(.xodball)$/.test(projectPath)) return saveProjectAsXodball(projectPath, project);

    if (!doesDirectoryExist(projectPath)) {
      // save entire project
      return saveProjectEntirely(projectPath, project);
    }

    // save only changes in the local patches
    return R.compose(
      localChanges => savePatchChanges(projectPath, localChanges)
        .then(() => saveProjectMeta(projectPath, project)),
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
      const name = XP.getBaseName(libName);

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
            XP.setProjectName(name),
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

/**
 * Saves Project into specified Path
 * and all changed libraries into user workspace lib folder.
 */
export const saveAll = def(
  'saveAll :: Path -> Path -> Project -> Project -> Promise', // Promise Project Error
  (workspacePath, projectPath, projectBefore, projectAfter) => {
    const changes = calculateDiff(
      XP.listPatchesWithoutBuiltIns(projectBefore),
      XP.listPatchesWithoutBuiltIns(projectAfter)
    );

    return Promise.all([
      saveProject(projectPath, changes, projectAfter),
      saveLibraries(workspacePath, changes, projectAfter),
    ]).then(R.always(projectAfter));
  }
);
