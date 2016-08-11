
import R from 'ramda';
import transform from './transformer';

const joinLines = R.join('\n');
const joinLineBlocks = R.join('\n\n');

function transpileImpl(impl) {
  const items = R.compose(
    joinLineBlocks,
    R.values,
    R.mapObjIndexed(
      (code, implId) => {
        const itemRef = `impl['${implId}']`;
        return joinLines([
          '// ---------------------------------------------------------------------',
          `${itemRef} = {};`,
          `(function(module, exports) {${code}})({exports: ${itemRef}}, ${itemRef});`,
        ]);
      }
    )
  );

  return joinLineBlocks([
    'var impl = {};',
    items(impl),
  ]);
}

function transpileNodes(nodes) {
  // __IMPLREF__ is a voodoo to work around JSON safety. For function references
  // we should actually refer to `impl` global variable. JSON.stringify would
  // enclose it in quoutes. So we place these special tokens to unquote the values
  // and refer to actual `impl` with a regex find/replace in an additional step.
  const injectFuncRefs = node => R.merge(node, {
    setup: `__IMPLREF__setup#${node.implId}__`,
    upkeep: `__IMPLREF__upkeep#${node.implId}__`,
    evaluate: `__IMPLREF__evaluate#${node.implId}__`,
  });

  const items = R.compose(
    joinLineBlocks,
    R.values,
    R.mapObjIndexed(
      (node, nodeId) => {
        const nodeJson = JSON.stringify(injectFuncRefs(node), null, 2);
        const template = `nodes['${nodeId}'] = new Node(${nodeJson});`;
        const statement = template.replace(/"__IMPLREF__(.+)#(.+)__"/g, "impl['$2'].$1");
        return statement;
      }
    )
  );

  return joinLineBlocks([
    'var nodes = {};',
    items(nodes),
  ]);
}

function transpileProject(topology) {
  return joinLines([
    `var topology = ${JSON.stringify(topology)};`,
    'var project = new Project({ nodes: nodes, topology: topology });',
  ]);
}

export default function transpile({ project, runtime }) {
  const proj = transform(project, ['espruino', 'js']);

  const launcher = joinLines([
    'function onInit() {',
    '  project.launch();',
    '}',
  ]);

  const saver = joinLines([
    'if (typeof save !== "undefined") {',
    '  save();',
    '}',
  ]);

  return joinLineBlocks([
    runtime,
    '// =====================================================================',
    transpileImpl(proj.impl),
    '// =====================================================================',
    transpileNodes(proj.nodes),
    transpileProject(proj.topology),
    launcher,
    saver,
    '',
  ]);
}
