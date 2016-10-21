import fs from 'fs';
import path from 'path';
import recReadDir from 'recursive-readdir';
import expandHomeDir from 'expand-home-dir';

import loadLibs from './loadLibs';

const readProjectMetaFile = (projectFile) => new Promise(
  resolve => {
    fs.readFile(projectFile, 'utf8', (errRd, projectMeta) => {
      if (errRd) { throw errRd; }
      const projectDir = path.dirname(projectFile);
      try {
        const result = Object.assign({}, JSON.parse(projectMeta));
        result.path = projectDir;

        resolve(result);
      } catch (loadMetaError) {
        resolve({
          error: true,
          message: "Can't parse project meta file: invalid JSON.",
          path: projectDir,
          stacktrace: loadMetaError,
        });
      }
    });
  }
);

export const getProjects = (workspace) => {
  const fullPath = expandHomeDir(workspace);

  return new Promise(resolve =>
    recReadDir(fullPath, (err, files) => {
      const projects = files.filter(
        filename => path.basename(filename) === 'project.xod'
      );
      const projectPromises = projects.map(readProjectMetaFile);

      return Promise.all(projectPromises).then(resolve);
    })
  );
};

const loadProjectWithoutLibs = (projectPath, workspace) => {
  const fullPath = path.resolve(
    expandHomeDir(workspace),
    projectPath
  );

  return new Promise(resolve =>
    recReadDir(fullPath, (err, files) => {
      const projectPromises = [];
      const projectFiles = files.filter(
        filename => (
          path.basename(filename) === 'project.xod' ||
          path.basename(filename) === 'patch.xodm' ||
          path.basename(filename) === 'patch.xodp'
        )
      );

      projectFiles.forEach(file => projectPromises.push(
        new Promise(resolveFile => {
          fs.readFile(file, 'utf8', (errRd, fileData) => {
            if (errRd) { throw errRd; }

            const result = {
              path: `./${path.relative(workspace, file)}`,
              content: JSON.parse(fileData),
            };

            if (result.content.id) {
              result.id = result.content.id;
            }

            resolveFile(result);
          });
        })
      ));

      return Promise.all(projectPromises)
        .then(resultFiles => {
          const pathsToIds = {};
          resultFiles.forEach(file => {
            if (file.path && file.id) {
              pathsToIds[path.dirname(file.path)] = file.id;
            }
          });

          return resultFiles.map(file => {
            const fileDir = path.dirname(file.path);

            if (!pathsToIds[fileDir]) {
              return file;
            }
            return Object.assign({ id: pathsToIds[fileDir] }, file);
          });
        })
        .then(resolve);
    })
  );
};

export const loadProjectWithLibs = (projectPath, workspace, libDir = workspace) =>
  loadProjectWithoutLibs(projectPath, workspace)
    .then(project => new Promise(resolve => {
      loadLibs(project[0].content.libs, libDir)
        .then(libs => {
          resolve({
            project,
            libs,
          });
        });
    }));

export default {
  getProjects,
  loadProjectWithLibs,
};
