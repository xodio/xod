import fs from 'fs';
import path from 'path';
import recReadDir from 'recursive-readdir';
import expandHomeDir from 'expand-home-dir';

export const getProjects = (workspace) => {
  const fullPath = expandHomeDir(workspace);

  return new Promise(resolve =>
    recReadDir(fullPath, (err, files) => {
      const projectPromises = [];
      const projects = files.filter(
        filename => path.basename(filename) === 'project.xod'
      );

      projects.forEach(projectFile => projectPromises.push(
        new Promise(resolveProjectLoad => {
          fs.readFile(projectFile, 'utf8', (errRd, projectMeta) => {
            if (errRd) { throw errRd; }

            const result = Object.assign({}, JSON.parse(projectMeta));
            result.path = path.dirname(projectFile);

            resolveProjectLoad(result);
          });
        })
      ));

      return Promise.all(projectPromises).then(resolve);
    })
  );
};

export const loadProject = (projectPath, workspace) => {
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

export default loadProject;
