
import R from 'ramda';
import transform from 'xod-transformer';
import { joinLines, joinLineBlocks } from './utils';

import jsRuntime from '../platform/runtime';

function transpileImpl(impl) {
  const items = R.compose(
    joinLineBlocks,
    R.values,
    R.mapObjIndexed(
      (code, implId) => {
        const itemRef = `impl['${implId}']`;
        let lines = [];

        // TODO: move such predicates to xod-core
        if (/^xod\/core\/input/.test(implId) || /^xod\/core\/output/.test(implId)) {
          lines = [`${itemRef} = identityNode();`];
        } else {
          lines = [
            `${itemRef} = {};`,
            `(function(module, exports) {${code}})({exports: ${itemRef}}, ${itemRef});`,
          ];
        }

        return joinLines(R.concat([
          '// ---------------------------------------------------------------------',
        ], lines));
      }
    )
  );

  return joinLineBlocks([
    'var impl = {};',
    "impl['<<const>>'] = startUpConstantNode();",
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
    } else if (val === '<<identity>>') {
      return '__PLACEHOLDER__@@identity@@__';
    }

    return val;
  }

  const items = R.compose(
    joinLineBlocks,
    R.values,
    R.mapObjIndexed(
      (node) => {
        const nodeJson = JSON.stringify(injectFuncRefs(node), replacer, 2);
        const template = `nodes['${node.id}'] = new Node(${nodeJson});`;
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

const validateTranspileOpts = (opts) => {
  const validity = R.map(
    (rule) => {
      if (!rule.check(opts)) { return rule.error; }

      return true;
    },
    [
      { check: R.has('project'), error: 'Transpile options should have a `project` property.' },
      { check: R.has('impls'), error: 'Transpile options should have a `impls` property.' },
      { check: R.has('launcher'), error: 'Transpile options should have a `launcher` property.' },
    ]
  );

  return R.ifElse(
    R.all(R.equals(true)),
    R.always({ valid: true }),
    R.compose(
      R.assoc('valid', false),
      R.flip(R.assoc('errors'))({}),
      R.join(' '),
      R.reject(R.equals(true))
    )
  )(validity);
};

export default function transpile(opts) {
  const validity = validateTranspileOpts(opts);
  if (!validity.valid) { throw new Error(validity.errors); }

  const proj = transform(opts.project, opts.impls);

  return joinLineBlocks([
    jsRuntime,
    '// =====================================================================',
    transpileImpl(proj.impl),
    '// =====================================================================',
    transpileNodes(proj.nodes),
    transpileProject(proj.topology),
    opts.launcher,
    '',
  ]);
}
