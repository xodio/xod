/* eslint-disable no-console */

import * as R from 'ramda';
import clc from 'cli-color';

function write(msg) {
  process.stderr.write(msg);
  process.stderr.write('\n');
}

export function error(msg) {
  if (R.is(Error, msg)) {
    // Unhandled error. Show stack trace.
    // TODO: actually all errors (expected and not) are wrapped in Error
    // objects for historical reasons. So this code will be called for
    // any error. But this is wrong: expected errors should not be wrapped
    write(clc.redBright(msg.message));
    write(msg.stack);
  } else {
    const prefix = clc.bold('Error:');
    write(clc.redBright(`✗ ${prefix} ${msg}`));
  }
}

export function warn(msg) { write(clc.yellow(`! ${msg}`)); }
export function notice(msg) { write(clc.cyan(msg)); }
export function success(msg) { write(clc.green(`✓ ${msg}`)); }
