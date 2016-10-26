// transpile|t <xodball>            Transpile code
// -t --target [espruino|arduino]   Transpile code for target device (espruino by default).
// -o --output [filename.txt]       Output result into file (or stdout by default).

/* eslint-disable no-console */

import path from 'path';
import { writeJSON, readJSON } from 'xod-fs';
import { transpile, runtime } from 'xod-espruino';
import { Spinner } from 'clui';
import * as msg from './messages';

export default (xodball, program) => {
  const target = program.target;
  const output = program.output;
  const filename = path.basename(xodball);

  msg.notice(`Transpiling ${filename} for ${msg.bold(target)}`);

  const spinner = new Spinner('Transpiling code...');

  spinner.start();

  readJSON(xodball)
    .then(project => transpile({ project, runtime }))
    .then(code => {
      spinner.stop();
      if (output) {
        return writeJSON(output, code)
          .then(() => {
            msg.success(`Result has been wrote into ${output} file.`);
          })
          .catch(err => {
            msg.error(`Error: Can't write result into ${output} file.`);
            msg.notice(err);
          });
      }

      process.stdout.write(code);
      process.exit(1);
      return code;
    })
    .catch(err => {
      spinner.stop();
      msg.error('Error: Can\'t transpile code!');
      msg.notice(err);
    });
};
