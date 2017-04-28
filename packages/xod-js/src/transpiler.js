import R from 'ramda';
import { Maybe, Either } from 'ramda-fantasy';
import Project from 'xod-project';

import { def } from './types';
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
  [R.equals(Project.PIN_TYPE.BOOLEAN), R.always(Boolean)],
  [R.equals(Project.PIN_TYPE.NUMBER), R.always(Number)],
  [R.equals(Project.PIN_TYPE.STRING), R.always(String)],
  [R.T, (type) => { throw Error(`Unknown type "${type}"!`); }],
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

// :: Node -> [[PinKey, PinValue]]
export const getCurriedPins = R.compose(
  R.toPairs,
  Project.getCurriedPins
);

// :: String -> [PinKey, PinValue] -> Node
export const createConstNode = R.curry((nodeId, curriedPinPair) => {
  const newNodeId = `${nodeId}_${curriedPinPair[0]}`;
  return {
    id: newNodeId,
    value: curriedPinPair[1],
    type: 'xod/internal/const',
    position: { x: 0, y: 0 },
    pins: {},
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
    R.map(createConstNodeAndLink(Project.getNodeId(node))),
    getCurriedPins
  )(node)
);

// :: Project -> Node[] -> (Patch -> Patch)[]
const createConstants = R.curry((project, nodes) =>
  R.compose(
    R.flatten,
    R.map(createConstantForNode(project))
  )(nodes)
);

// :: Patch -> Patch
const clearNodePins = R.over(
  R.lensProp('nodes'),
  R.map(R.omit(['pins']))
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
  .map(clearNodePins)
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
    "impl['xod/internal/const'] = startUpConstantNode();",
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
      { check: R.has('path'), error: 'Transpile options should have a `path` property.' },
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

/**
 * This function accepts an object with options for transpilation.
 * - project -- a project (v2)
 * - path -- a string of entry-point patch path
 * - impls -- an array of strings of target platforms (e.g., ['js', 'nodejs'])
 * - launcher -- a platform-specific launcher
 *
 * This function is called from platform-specific transpilation functions
 * (see target-espruino.js and target-nodejs.js).
 *
 * Basic steps of transpilation:
 *
 * 1. Validate for existance of all needed options.
 *
 * 2. Flatten project.
 *
 * 3. Extract implementations from patches.
 *
 * 4. Transform entry-point patch
 *
 *    4.1. Replace curried pins with new nodes and listLinksByNode
 *
 *    4.2. Renumber nodes (and nodeIds in links pinRefs) using index (strings becomes integers)
 *
 * 5. Get topology of transformed entry-point patch
 *
 * 6. Transform nodes (runtime is using another shape of nodes, so we transform it).
 *
 * 7. Join lines using \n\n:
 *    - runtime
 *    - transpileImpl: implementations wrapped with closure and collected into one object
 *    - transpileNodes: an object of nodes indexed by id
 *    - transpileProject: topology and project definition
 *    - launcher from options
 *
 * PROFIT
 *
 * @function transpile
 * @param {Object} opts Options for transpilation. See docs above.
 * @returns {Either<Error|String>} Code that could be uploaded to target platform or an Error.
 */
export default def(
  'transpile :: { project :: Project, path :: PatchPath, impls :: [Source], launcher :: String } -> Either Error String',
  (opts) => {
    const validity = validateTranspileOpts(opts);
    if (!validity.valid) {
      return Either.Left(new Error(validity.errors));
    }

    return Project.flatten(opts.project, opts.path, opts.impls)
      .chain((proj) => {
        const impls = extractPatchImpls(opts.impls, proj);

        const entryPatch = transformPatch(opts.path, proj).chain(Project.renumberNodes);

        if (Maybe.isNothing(entryPatch)) {
          return Either.Left(new Error('Entry patch was not found in the flattened project.'));
        }

        const topology = Project.getTopology(entryPatch);
        const nodes = transformNodes(entryPatch, proj);

        const code = joinLineBlocks([
          jsRuntime,
          '// =====================================================================',
          transpileImpl(impls),
          '// =====================================================================',
          transpileNodes(nodes),
          transpileProject(topology),
          opts.launcher,
          '',
        ]);

        return Either.of(code);
      });
  }
);
