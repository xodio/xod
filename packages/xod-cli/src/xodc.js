#!/usr/bin/env node

/* eslint-disable no-console */

import program from 'commander';
import build from './xodc-build';
import doc from './xodc-doc';
import pack from './xodc-pack';
import transpile from './xodc-transpile';
import unpack from './xodc-unpack';
import upload from './xodc-upload';

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

program
  .command('doc <outputDir> <templatesDir> <projectDir>')
  .description('Generate doc for project')
  .option('-c, --clear [clear]', 'Clear output dir before generate documentation', false)
  .alias('d')
  .action(doc);

program
  .command('build <file> <board>')
  .description('Build file for board')
  .action(build);

program
  .command('upload <file> <board> <port>')
  .description('Upload file to board on port')
  .action(upload);

program.parse(process.argv);

if (program.args.length === 0) {
  console.log(program.help());
}
