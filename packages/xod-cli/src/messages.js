/* eslint-disable no-console */

import clc from 'cli-color';

function write(msg) {
  process.stderr.write(msg);
  process.stderr.write('\n');
}

export function error(msg) {
  const prefix = clc.bold('Error:');
  write(clc.redBright(`✗ ${prefix} ${msg}`));
}

export function warn(msg) { write(clc.yellow(`! ${msg}`)); }
export function notice(msg) { write(clc.cyan(msg)); }
export function success(msg) { write(clc.green(`✓ ${msg}`)); }
