/* eslint-disable no-param-reassign */
import { compose, filter, identity, last, map, startsWith } from 'ramda';
import { transformProject, transpile, LIVENESS } from 'xod-arduino';
import { loadProject } from 'xod-fs';
import { createError, foldEither } from 'xod-func-tools';
import * as xdb from 'xod-deploy-bin';

export const loadProjectTask = (workspaces, projectPath) => ({
  title: 'Project loading',
  task: ctx =>
    loadProject(workspaces, projectPath).then(project => {
      ctx.project = project;
    }),
});

export const transformTask = (patchName, debug) => ({
  title: 'Transforming',
  task: ctx => {
    ctx.transform = transformProject(
      ctx.project,
      patchName,
      debug ? LIVENESS.DEBUG : LIVENESS.NONE
    );
  },
});

export const transpileTask = () => ({
  title: 'Transpiling',
  task: ctx => {
    ctx.transpile = compose(
      eitherCode =>
        foldEither(
          err => {
            throw err;
          },
          identity,
          eitherCode
        ),
      map(transpile)
    )(ctx.transform);
  },
});

export const checkBoardTask = (workspace, fqbn) => ({
  title: 'Check board',
  task: async ctx => {
    const boards = await xdb.listBoards(workspace, ctx.arduinoCli);
    const board = last(filter(el => el.fqbn === fqbn, boards.installed));

    // toolchain not installed - handle it
    if (board) {
      ctx.board = board;
    } else {
      const packageDep = compose(
        last,
        filter(el => startsWith(el.package, fqbn))
      )(boards.available);
      throw createError('ARDUINO_DEPENDENCIES_MISSING', {
        libraries: [],
        libraryNames: [],
        packages: packageDep ? [packageDep.package] : [],
        packageNames: packageDep ? [packageDep.packageName] : [],
      });
    }
  },
});
