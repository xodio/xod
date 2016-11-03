#!/usr/bin/env node

/* eslint-disable no-console */

import program from 'commander';
import pack from './xodc-pack';
import unpack from './xodc-unpack';
import transpile from './xodc-transpile';

program
  .version('0.0.1');

program
  .command('pack <projectDir> <output>')
    .description('Pack project directory into xodball')
    .alias('p')
    .action(pack);
program
  .command('unpack <xodball> <workspace>')
    .description('Unpack xodball into new project directory')
    .alias('u')
    .action(unpack);

program
  .command('transpile <input>')
    .description('Transpile project into device runtime')
    .option('-t, --target [target]', 'Target device for transpilation', 'espruino')
    .option('-o, --output [filename]', 'Write result of transpilation into file', false)
    .alias('t')
    .action(transpile);

program.parse(process.argv);

if (program.args.length === 0) {
  console.log(program.help());
}
