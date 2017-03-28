import fs from 'fs';
import path from 'path';
import R from 'ramda';

import { loadLibs } from './loadLibs';
import { readDir, readJSON } from './read';
import { resolvePath } from './utils';

const hasId = R.has('id');
const withIdFirst = (a, b) => ((!hasId(a) && hasId(b)) || -1);

// :: unpackedFile -> true|false
const isProject = R.pipe(
  R.prop('path'),
  path.basename,
  R.equals('project.xod')
);

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
  .then(data => Object.assign(data, {
    path: path.dirname(projectFile),
  }));

export const getProjects = workspace => readDir(workspace)
  .then(files => files.filter(_ => path.basename(_) === 'project.xod'))
  .then(projects => Promise.all(
    projects.map(
      project => readProjectMetaFile(project)
        .catch(err => ({ error: true, message: err.toString(), path: project }))
    )
  ));

export const loadProjectWithoutLibs = projectPath =>
  readDir(projectPath)
    .then(files => files.filter(
      filename => (
        path.basename(filename) === 'project.xod' ||
        path.basename(filename) === 'patch.xodm' ||
        path.basename(filename) === 'patch.xodp'
      )
    ))
    .then(projects => projects.map(project =>
      readJSON(project).then((data) => {
        const { base, dir } = path.parse(project);
        const projectFolder = path.resolve(projectPath, '..');
        const result = {
          path: `./${path.relative(projectFolder, project)}`,
          content: data,
        };

        if (data.id) { result.id = data.id; }
        if (base === 'patch.xodm') {
          const impls = fs
            .readdirSync(dir)
            .filter(filename => !/^\.xod.?$/.test(path.extname(filename)))
            .map(filename => ([
              path.basename(filename),
              fs.readFileSync(path.resolve(dir, filename)).toString(),
            ]))
            .reduce((_, [k, v]) => Object.assign(_, { [k]: v }), {});

          if (!R.isEmpty(impls)) {
            result.content.impls = impls;
          }
        }
        return result;
      })
    ))
    .then(Promise.all.bind(Promise))
    .then(assignIdsToAllPatches);

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
