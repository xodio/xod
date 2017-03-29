import fsp from 'fs-promise';
import path from 'path';
import R from 'ramda';

import XF from 'xod-func-tools';
import { loadLibs } from './loadLibs';
import { readDir, readJSON } from './read';
import { resolvePath } from './utils';

const hasId = R.has('id');
const withIdFirst = (a, b) => ((!hasId(a) && hasId(b)) || -1);

// :: String -> String -> Boolean
const basenameEquals = basename => R.compose(
  R.equals(basename),
  path.basename
);

// :: [String] -> String -> Boolean
const basenameAmong = basenames => R.compose(
  XF.isAmong(basenames),
  path.basename
);

// :: [String] -> String -> Boolean
const extAmong = extensions => R.compose(
  XF.isAmong(extensions),
  path.extname
);

// :: unpackedFile -> true|false
const isProject = R.pipe(
  R.prop('path'),
  path.basename,
  R.equals('project.xod')
);

// :: [Promise a] -> Promise a
const allPromises = promises => Promise.all(promises);

// only patch.xodm have a patch id,
// this method assign ids for patch.xodp by comparing paths
// :: unpackedFiles -> unpackedFilesWithIds
const assignIdsToAllPatches = (files) => {
  const mem = {};
  return R.pipe(
    R.sort(withIdFirst),
    R.map((file) => {
      const dir = path.dirname(file.path);
      if (R.has(dir, mem)) { return R.assoc('id', mem[dir], file); }
      if (hasId(file)) { mem[dir] = file.id; }
      return file;
    })
  )(files);
};

// :: project -> libs[]
const getProjectLibs = R.pipe(
  R.find(isProject),
  R.path(['content', 'libs'])
);

const readProjectMetaFile = projectFile => readJSON(projectFile)
  .then(R.assoc('path', path.dirname(projectFile)))
  .catch(err => ({ error: true, message: err.toString(), path: projectFile }));

// Returns a Promise of all project metas for given workspace path
export const getProjects = R.composeP(
  allPromises,
  R.map(readProjectMetaFile),
  R.filter(basenameEquals('project.xod')),
  readDir
);

// Returns a promise of filename / content pair for a given
// `filename` path relative to `dir`
// :: String -> String -> Promise (Pair String String)
const readImplFile = dir => filename => 
  fsp.readFile(path.resolve(dir, filename)).then(content => [
    filename,
    content,
  ]);

// Returns a map with filenames in keys and contents in values of
// all implementation source files in a directory given as argument
// :: String -> Promise (StrMap String)
const readImplFiles = dir => R.composeP(
  R.fromPairs,
  allPromises,
  R.map(readImplFile(dir)),
  R.filter(extAmong(['.c', '.cpp', '.h', '.inl', '.js'])),
  fsp.readdir
)(dir);

// :: String -> String -> Promise { path :: String, content :: Object, id :: String }
const readXodFile = projectPath => xodfile =>
  readJSON(xodfile).then((data) => {
    const { base, dir } = path.parse(xodfile);
    const projectFolder = path.resolve(projectPath, '..');
    const implPromise = (base === 'patch.xodm')
      ? readImplFiles(dir)
      : Promise.resolve({});

    return implPromise.then(impls =>
      XF.omitNilValues({
        path: `./${path.relative(projectFolder, xodfile)}`,
        content: R.merge(data, XF.omitEmptyValues({ impls })),
        id: data.id,
      })
    );
  });

export const loadProjectWithoutLibs = projectPath => R.composeP(
  assignIdsToAllPatches,
  allPromises,
  R.map(readXodFile(projectPath)),
  R.filter(basenameAmong([
    'project.xod',
    'patch.xodm',
    'patch.xodp'
  ])),
  readDir
)(projectPath);

export const loadProjectWithLibs = (projectPath, workspace, libDir = workspace) =>
  loadProjectWithoutLibs(resolvePath(path.resolve(workspace, projectPath)))
    .then(project => loadLibs(getProjectLibs(project), resolvePath(libDir))
      .then(libs => ({
        project,
        libs,
      }))
      .catch((err) => {
        throw Object.assign(err, {
          path: resolvePath(libDir),
          libs: getProjectLibs(project),
        });
      })
    );

export default {
  getProjects,
  loadProjectWithLibs,
  loadProjectWithoutLibs,
};
