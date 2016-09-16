
import R from 'ramda';
import transform from './transformer';
import defaultRuntime from './runtime';

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
  // __PLACEHOLDER__ is a voodoo to work around JSON safety. We can’t reference
  // real JS symbols in JSON string so we leave a placeholder and use
  // find-n-replace over result string to substitute proper references.
  const injectFuncRefs = node => R.merge(node, {
    setup: `__PLACEHOLDER__@@impl['${node.implId}'].setup@@__`,
    upkeep: `__PLACEHOLDER__@@impl['${node.implId}'].upkeep@@__`,
    evaluate: `__PLACEHOLDER__@@impl['${node.implId}'].evaluate@@__`,
    nodes: '__PLACEHOLDER__@@nodes@@__',
  });

  function replacer(key, val) {
    if (val === Boolean || val === Number || val === String) {
      // leave type as is
      return `__PLACEHOLDER__@@${val.name}@@__`;
    } else if (val == '<<identity>>') {
      return '__PLACEHOLDER__@@identity@@__';
    }

    return val;
  }

  const items = R.compose(
    joinLineBlocks,
    R.values,
    R.mapObjIndexed(
      (node, nodeId) => {
        const nodeJson = JSON.stringify(injectFuncRefs(node), replacer, 2);
        const template = `nodes['${nodeId}'] = new Node(${nodeJson});`;
        const statement = template.replace(/"__PLACEHOLDER__@@(.+)@@__"/g, '$1');
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

export default function transpile({ project, customRuntime }) {
  const proj = transform(project, ['espruino', 'js']);
  const runtime = customRuntime || defaultRuntime;

  const launcher = joinLines([
    'function onInit() {',
    '  project.launch();',
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
    '',
  ]);
}
