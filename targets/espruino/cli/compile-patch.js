#!/usr/bin/env node

var fs = require('fs');

var opts = require('node-getopt').create([
  ['h', 'help', 'display this help'],
  //['v', 'version', 'show version'],
]).bindHelp().parseSystem();

var inFilename = opts.argv[0];
var inString = fs.readFileSync(inFilename, {encoding: 'utf-8'});
var source = JSON.parse(inString);

var outputLines = [
  'var nodes = {};'
];

source.nodes.forEach((node) => {
  var type = node.type;
  if (!type.startsWith('core.')) {
    throw new Error('Unknown node type: ' + type);
  }

  type = type.substr('core.'.length);

  outputLines.push(
    '(function() {',
      `var meta = require("@xod/meta/${type}");`,
      `var nodeImpl = require("@xod/impl/${type}");`,
      `nodes[${node.id}] = new nodeImpl(meta);`,
    '})();'
  );
});

source.links.forEach((node) => {
  outputLines.push(
    `nodes[${node.fromNode}].link('${node.fromOutput}', nodes[${node.toNode}], '${node.toInput}');`
  );
});

var outFilename = opts.argv[1];
var outString = outputLines.join('\n');
if (!outFilename || outFilename === '-') {
  console.log(outString);
} else {
  fs.writeFileSync(outFilename, outString);
}

