// transpile|t <xodball>            Transpile code
// -t --target [espruino|arduino]   Transpile code for target device (espruino by default).
// -o --output [filename.txt]       Output result into file (or stdout by default).

/* eslint-disable no-console */

import path from 'path';
import fs from 'fs';
import { transpile, runtime } from 'xod-espruino';
import { Spinner } from 'clui';

export default (xodball, program) => {
  const target = program.target;
  const output = program.output;
  const filename = path.basename(xodball);

  console.log(`Transpiling ${filename} for ${target}`);

  const spinner = new Spinner('Transpiling code...');

  spinner.start();

  const json = fs.readFileSync(xodball);
  const project = JSON.parse(json);
  const code = transpile({ project, runtime });

  spinner.stop();

  if (output) {
    fs.writeFileSync(output, code);
    console.log('Result has been wrote into ', output, 'file.');
    process.exit(1);
  }

  process.stdout.write(code);
  process.exit(1);
};
