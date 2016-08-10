
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
  const injectFuncRefs = R.map(node => R.merge(node, {
    setup: `__IMPLREF__setup#${node.implId}__`,
    upkeep: `__IMPLREF__upkeep#${node.implId}__`,
    evaluate: `__IMPLREF__evaluate#${node.implId}__`,
  }));

  const nodesJson = JSON.stringify(injectFuncRefs(nodes), null, 2);
  const nodesCode = nodesJson.replace(/"__IMPLREF__(.+)#(.+)__"/g, "impl['$2'].$1");

  return `var nodes = ${nodesCode}`;
}

export default function transpile({ project, runtime }) {
  const proj = transform(project, ['espruino', 'js']);

  const launcher = joinLines([
    'function onInit() {',
    '  project.launch();',
    '}',
  ]);

  const payload = joinLineBlocks([
    transpileImpl(proj.impl),
    '// =====================================================================',
    transpileNodes(proj.nodes),
    'var project = new Project(nodes);',
    launcher,
  ]);

  return joinLineBlocks([
    runtime,
    '// =====================================================================',
    payload,
    'save();',
  ]);
}
