/* eslint-disable no-param-reassign */
import { exit } from 'process';
import { pick } from 'ramda';
import * as xodFs from 'xod-fs';
import {
  getProjectName,
  getProjectDescription,
  getProjectVersion,
} from 'xod-project';
import { createError } from 'xod-func-tools';
import BaseCommand from '../baseCommand';
import * as commonArgs from '../args';
import * as myFlags from '../flags';
import { getListr } from '../listr';
import {
  getAccessToken,
  getLib,
  getUser,
  postUserLib,
  putUserLib,
} from '../apis';

const packLibVersion = async projectDir => {
  const projectWithoutLibs = await xodFs.loadProjectWithoutLibs(
    await xodFs.findClosestProjectDir(projectDir)
  );
  const xodball = await xodFs.pack(projectWithoutLibs, {});
  return {
    libname: getProjectName(xodball),
    version: {
      description: getProjectDescription(xodball),
      folder: { 'xodball.json': JSON.stringify(xodball) },
      semver: `v${getProjectVersion(xodball)}`,
    },
  };
};

const createLibUri = (orgname, libname, tag) => ({
  orgname,
  libname,
  tag,
});

const uriToStringWithoutTag = libUri => `${libUri.orgname}/${libUri.libname}`;

const uriToString = libUri => `${uriToStringWithoutTag(libUri)}@${libUri.tag}`;

class PublishCommand extends BaseCommand {
  async run() {
    this.parseArgv(PublishCommand);
    await this.parseEntrypoint();
    await this.getCredentials();
    const {
      'on-behalf': onBehalf,
      api,
      password,
      quiet,
      username,
    } = this.flags;
    const { projectPath } = this.args;

    const targetUsername = onBehalf || username;

    const loadLibTask = {
      title: 'Load library',
      task: ctx =>
        packLibVersion(projectPath).then(({ libname, version }) => {
          ctx.libname = libname;
          ctx.version = version;
          ctx.libUri = createLibUri(targetUsername, libname, version.semver);
        }),
    };

    const getAccessTokenTask = {
      title: 'Authenticate',
      task: ctx =>
        getAccessToken(api, username, password)
          .then(token => {
            ctx.token = token;
          })
          .catch(error => {
            throw createError('PUBLISH_AUTH_FAILED', {
              username,
              status: error.statusText || error.message,
            });
          }),
    };

    const checkUserTask = {
      title: 'Get user',
      task: ctx =>
        getUser(api, targetUsername)
          .catch(error => {
            if (error.status === 404)
              throw createError('PUBLISH_USER_NOT_EXIST', {
                username: targetUsername,
              });
            throw createError('PUBLISH_USER_OTHER_ERROR', {
              username: targetUsername,
              status: error.statusText || error.message,
            });
          })
          .then(user => {
            if (
              user.username !== username &&
              user.trusts.indexOf(username) === -1
            ) {
              throw createError('PUBLISH_ACCESS_DENIED', {
                username,
                lib: uriToString(ctx.libUri),
                libOwner: targetUsername,
              });
            }
            ctx.user = user;
            return true;
          }),
    };

    const getLibTask = {
      title: 'Get library',
      task: ctx =>
        getLib(api, targetUsername, ctx.libname)
          .then(lib => {
            ctx.library = lib;
          })
          .catch(error => {
            if (error.status !== 404)
              throw createError('PUBLISH_LIB_OTHER_ERROR', {
                lib: uriToStringWithoutTag(ctx.libUri),
                status: error.statusText || error.message,
              });
            return true;
          }),
    };

    const putLibraryTask = {
      title: 'Create library',
      skip: ctx => (ctx.library ? 'Already exists' : false),
      task: ctx =>
        putUserLib(api, ctx.token, targetUsername, ctx.libname).catch(error => {
          if (error.status === 403) {
            throw createError('PUBLISH_ACCESS_DENIED', {
              username,
              lib: uriToString(ctx.libUri),
              libOwner: targetUsername,
            });
          }
          throw createError('PUBLISH_PUT_LIBRARY_OTHER_ERROR', {
            lib: uriToStringWithoutTag(ctx.libUri),
            status: error.statusText || error.message,
          });
        }),
    };

    const publishLibraryTask = {
      title: 'Publish library',
      task: ctx =>
        postUserLib(api, ctx.token, targetUsername, ctx.libname, ctx.version)
          .then(() => exit(0))
          .catch(error => {
            if (error.status === 409) {
              throw createError('PUBLISH_LIBVERSION_EXISTS', {
                lib: uriToString(ctx.libUri),
              });
            }
            throw createError('PUBLISH_POST_LIBVERSION_OTHER_ERROR', {
              lib: uriToString(ctx.libUri),
              status: error.statusText || error.message,
            });
          }),
    };

    await getListr(
      !quiet,
      [
        loadLibTask,
        {
          title: 'Prerequisites',
          task: () =>
            getListr(!quiet, [getAccessTokenTask, checkUserTask, getLibTask], {
              concurrent: true,
            }),
        },
        putLibraryTask,
        publishLibraryTask,
      ],
      { collapse: false }
    )
      .run()
      .then(() => exit(0))
      .catch(err => {
        this.printError(err);
        return exit(100);
      });
  }
}

PublishCommand.description = 'publish a library';

PublishCommand.usage = 'publish [options] [project]';

PublishCommand.flags = {
  ...BaseCommand.flags,
  ...pick(['api', 'password', 'username'], myFlags),
  'on-behalf': myFlags.onBehalf,
};

PublishCommand.args = [commonArgs.project];

PublishCommand.examples = [
  'Publish the current project with the version defined in `project.xod`\n' +
    '$ xodc publish\n',
  'Publish a project saved as xodball\n$ xodc publish foo.xodball',
];

PublishCommand.strict = false;

export default PublishCommand;
