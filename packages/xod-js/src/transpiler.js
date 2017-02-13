import R from 'ramda';
import { Maybe } from 'ramda-fantasy';
// import transform from 'xod-transformer';
import Project from 'xod-project';

import { joinLines, joinLineBlocks } from './utils';

import jsRuntime from '../platform/runtime';

// =============================================================================
//
// Functions for extracting data from flattened project using xod-project API
//
// =============================================================================

// :: Project -> [[Path, Patch]]
const getPatchesMap = R.converge(
  R.zipObj,
  [
    Project.listPatchPaths,
    Project.listPatches,
  ]
);

// :: String[] -> Project -> { Path: String }
export const extractPatchImpls = R.curry((impls, project) => R.compose(
  R.reject(Maybe.isNothing),
  R.map(R.compose(
    R.unnest,
    Project.getImplByArray(impls)
  )),
  getPatchesMap
)(project));

// =============================================================================
//
// Transforming functions
//
// =============================================================================

// Converts pin string type name to native JS type object
// :: String -> JSType
const convertToNativeTypes = R.cond([
  [R.equals(Project.PIN_TYPE.PULSE), R.always('<<identity>>')],
  [R.equals(Project.PIN_TYPE.BOOL), R.always(Boolean)],
  [R.equals(Project.PIN_TYPE.NUMBER), R.always(Number)],
  [R.equals(Project.PIN_TYPE.STRING), R.always(String)],
  [R.T, () => { throw Error('Unknown type!'); }],
]);

// :: Patch -> { pinKey: Function }
export const getInputTypes = R.compose(
  R.map(convertToNativeTypes),
  R.map(Project.getPinType),
  R.indexBy(Project.getPinKey),
  Project.listInputPins
);

// :: String -> Patch -> { pinKey: PinRef[] }
export const getOutLinks = R.curry((nodeId, patch) =>
  R.compose(
    R.map(
      R.map(R.applySpec({
        key: Project.getLinkInputPinKey,
        nodeId: Project.getLinkInputNodeId,
      }))
    ),
    R.groupBy(Project.getLinkOutputPinKey),
    R.filter(Project.isLinkOutputNodeIdEquals(nodeId)),
    Project.listLinksByNode(nodeId)
  )(patch)
);

// :: Node -> Patch -> [[PinKey, PinValue]]
export const getCurriedPins = R.curry((node, patch) =>
  R.compose(
    R.toPairs,
    R.map(key => Project.getPinCurriedValue(key, node).getOrElse({})),
    R.indexBy(Project.getPinKey),
    R.filter(Project.isPinCurried(R.__, node)),
    R.map(Project.getPinKey),
    Project.listPins
  )(patch)
);

// :: String -> [PinKey, PinValue] -> Node
export const createConstNode = R.curry((nodeId, curriedPinPair) => {
  const newNodeId = `${nodeId}_${curriedPinPair[0]}`;
  return {
    id: newNodeId,
    value: curriedPinPair[1],
    type: '<<const>>',
  };
});

// :: String -> [PinKey, PinValue] -> Link
export const createConstLink = R.curry((nodeId, curriedPinPair) => {
  const newNodeId = `${nodeId}_${curriedPinPair[0]}`;
  return {
    id: `${newNodeId}-to-${nodeId}`,
    input: { pinKey: curriedPinPair[0], nodeId },
    output: { pinKey: 'value', nodeId: newNodeId },
  };
});

// TODO: Make it more readable
// :: String -> [PinKey, PinValue] -> (Patch -> Patch)[]
const createConstNodeAndLink = R.converge(
  (assocNode, assocLink) => ([
    patch => Maybe.of(assocNode(patch)),
    assocLink,
  ]),
  [
    R.compose(
      Project.assocNode,
      createConstNode
    ),
    R.compose(
      Project.assocLink,
      createConstLink
    ),
  ]
);

// :: Project -> Node -> (Patch -> Patch)[]
const createConstantForNode = R.curry((project, node) =>
  R.compose(
    Maybe.maybe([], R.identity),
    R.map(R.compose(
      R.map(createConstNodeAndLink(Project.getNodeId(node))),
      getCurriedPins(node)
    )),
    Project.getPatchByPath(R.__, project),
    Project.getNodeType
  )(node)
);

// :: Project -> Node[] -> (Patch -> Patch)[]
const createConstants = R.curry((project, nodes) =>
  R.compose(
    R.flatten,
    R.map(createConstantForNode(project))
  )(nodes)
);

// :: Project -> Patch -> Patch
export const addConstNodesToPatch = R.curry((project, patch) => {
  const nodes = Project.listNodes(patch);
  const assocNodesAndLinks = createConstants(project, nodes);

  return R.compose(
    R.unnest,
    R.reduce(R.flip(R.chain), R.__, assocNodesAndLinks),
    Maybe.of
  )(patch);
});

// :: Path -> Project -> Maybe Patch
export const transformPatch = R.curry((path, project) =>
  Project.getPatchByPath(path, project)
  .map(addConstNodesToPatch(project))
);

// :: Patch -> Project -> Node -> Node
export const transformNode = R.curry((patch, project, node) => {
  const nodeId = Project.getNodeId(node);
  const type = Project.getNodeType(node);
  const typePatch = Project.getPatchByPath(type, project);

  const newNode = {
    id: nodeId,
    implId: type,
    inputTypes: typePatch.map(getInputTypes).getOrElse({}),
    outLinks: getOutLinks(nodeId, patch),
  };

  if (R.has('value', node)) {
    return R.assoc('value', node.value, newNode);
  }

  return newNode;
});

// :: Patch -> Project -> Node[]
export const transformNodes = R.curry((patch, project) =>
  R.compose(
    R.flatten,
    R.map(transformNode(patch, project)),
    Project.listNodes
  )(patch)
);

// =============================================================================
//
// Transpiling functions
//
// =============================================================================

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

  return Project.flatten(opts.project, opts.path, opts.impls)
    .chain((proj) => {
      const impls = extractPatchImpls(opts.impls, proj);

      const entryPatch = transformPatch(opts.path, proj).chain(Project.renumberNodes);
      if (Maybe.isNothing(entryPatch)) {
        throw new Error('Entry patch was not found in the flattened project.');
      }

      const topology = Project.getTopology(entryPatch);
      const nodes = transformNodes(entryPatch, proj);

      return joinLineBlocks([
        jsRuntime,
        '// =====================================================================',
        transpileImpl(impls),
        '// =====================================================================',
        transpileNodes(nodes),
        transpileProject(topology),
        opts.launcher,
        '',
      ]);
    });
}
