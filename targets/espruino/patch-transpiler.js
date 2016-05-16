
export function transpilePatch(source) {
  if (source instanceof String) {
    source = JSON.parse(inString);
  }

  let outputLines = [
    'var nodes = {};'
  ];

  source.nodes.forEach((node) => {
    var type = node.type;
    if (!type.startsWith('core.')) {
      throw new Error('Unknown node type: ' + type);
    }

    type = type.substr('core.'.length);
    var props = node.props || {}; // TODO: strip props equal to default values

    outputLines.push(
      '(function() {',
        `var meta = require("@xod/meta/${type}");`,
        `var nodeImpl = require("@xod/impl/${type}");`,
        `var props = ${JSON.stringify(props)};`,
        `nodes[${node.id}] = new nodeImpl(meta, props);`,
      '})();'
    );
  });

  source.links.forEach((node) => {
    outputLines.push(
      `nodes[${node.fromNode}].link('${node.fromOutput}', nodes[${node.toNode}], '${node.toInput}');`
    );
  });

  return outputLines.join('\n');
}
