#!/usr/bin/env node

var fs = require('fs');
var JSON5 = require('json5');

var opts = require('node-getopt').create([
  ['h', 'help', 'display this help'],
  //['v', 'version', 'show version'],
]).bindHelp().parseSystem();

var inFilename = opts.argv[0];
var inString = fs.readFileSync(inFilename, {encoding: 'utf-8'});
var source = JSON5.parse(inString);

var meta = {
  inputs: [],
  outputs: [],
};

source.outputs = source.outputs || [];
source.outputs.forEach((output) => {
  meta.outputs.push({
    name: output.name,
    type: output.type,
  });
});

source.inputs = source.inputs || [];
source.inputs.forEach((input) => {
  meta.inputs.push({
    name: input.name,
    type: input.type,
  });
});

var outFilename = opts.argv[1];
var outString = 'exports = ' + JSON.stringify(meta) + ';';
if (!outFilename || outFilename === '-') {
  console.log(outString);
} else {
  fs.writeFileSync(outFilename, outString);
}
