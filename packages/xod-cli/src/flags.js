import { flags } from '@oclif/command';

export const help = flags.help({
  char: 'h',
});

export const version = flags.version({
  char: 'V',
});

export const api = flags.string({
  description: 'XOD API hostname',
  env: 'XOD_API',
  default: 'xod.io',
  helpValue: 'hostname',
});

export const debug = flags.boolean({
  description: 'enable debug traces',
  env: 'XOD_DEBUG',
  default: false,
});

export const onBehalf = flags.string({
  description: 'publish on behalf of the username',
  env: 'XOD_ONBEHALF',
  helpValue: 'username',
});

export const password = flags.string({
  description: 'XOD API password',
  env: 'XOD_PASSWORD',
  helpValue: 'password',
});

export const quiet = flags.boolean({
  char: 'q',
  description: 'do not log messages other than errors',
  default: false,
});

export const username = flags.string({
  description: 'XOD API username',
  env: 'XOD_USERNAME',
  helpValue: 'username',
});

export const workspace = flags.string({
  char: 'w',
  description: 'use the workspace specified, defaults to $HOME/xod',
  env: 'XOD_WORKSPACE',
  helpValue: 'path',
  default: '~/xod',
});
