import R from 'ramda';
import { Maybe, Either } from 'ramda-fantasy';
import * as Project from 'xod-project';
import * as XF from 'xod-func-tools';

import { def } from './types';
import { joinLines, joinLineBlocks } from './utils';

import jsRuntime from '../platform/runtime';

const CONST_NODETYPES = {
  [Project.PIN_TYPE.STRING]: 'xod/core/constant-string',
  [Project.PIN_TYPE.NUMBER]: 'xod/core/constant-number',
  [Project.PIN_TYPE.BOOLEAN]: 'xod/core/constant-boolean',
  [Project.PIN_TYPE.PULSE]: 'xod/core/constant-boolean',
};

// =============================================================================
//
// Functions for local types
//
// =============================================================================
const getTPinKey = def(
  'getTPinKey :: TPin -> PinKey',
  R.prop('key')
);
const getTPinLabel = def(
  'getTPinLabel :: TPin -> PinLabel',
  R.prop('label')
);
const getTPinType = def(
  'getTPinType :: TPin -> DataType',
  R.prop('type')
);
const isOutputTPin = def(
  'getTPinDirection :: TPin -> Boolean',
  R.propEq('isOutput', true)
);
const isInputTPin = def(
  'getTPinDirection :: TPin -> Boolean',
  R.complement(isOutputTPin)
);
const getTPinValue = def(
  'getTPinValue :: TPin -> DataValue',
  R.prop('value')
);

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

// :: [Pin] -> { pinKey: Function }
export const getInputTypes = R.compose(
  R.map(R.compose(
    convertToNativeTypes,
    Project.getPinType
  )),
  R.indexBy(Project.getPinLabel),
  R.filter(Project.isInputPin)
);

const getOutValues = def(
  'getOutValues :: Node -> [Pin] -> Map PinKey DataValue',
  (node, pins) => R.compose(
    R.map(Project.getBoundValueOrDefault(R.__, node)),
    R.indexBy(Project.getPinLabel),
    R.reject(Project.isPulsePin),
    R.filter(Project.isOutputPin)
  )(pins)
);

const getNormalizedPinLabel = def(
  'getNormalizedPinLabel :: PinKey -> Patch -> PinLabel',
  (pinKey, patch) => R.compose(
    Project.getPinLabel,
    R.find(R.compose(
      R.equals(pinKey),
      Project.getPinKey
    )),
    Project.normalizePinLabels,
    Project.listPins
  )(patch)
);

// :: String -> Project -> Patch -> { pinKey: PinRef[] }
export const getOutLinks = R.curry((nodeId, project, entryPatch) =>
  R.compose(
    R.map(
      R.map(R.applySpec({
        key: R.converge(
          getNormalizedPinLabel,
          [
            Project.getLinkInputPinKey,
            R.compose(
              Project.getPatchByNodeIdUnsafe(R.__, entryPatch, project),
              Project.getLinkInputNodeId
            ),
          ]
        ),
        nodeId: Project.getLinkInputNodeId,
      }))
    ),
    R.groupBy(R.converge(
      getNormalizedPinLabel,
      [
        Project.getLinkOutputPinKey,
        () => Project.getPatchByNodeIdUnsafe(nodeId, entryPatch, project),
      ]
    )),
    R.filter(Project.isLinkOutputNodeIdEquals(nodeId)),
    Project.listLinksByNode(nodeId)
  )(entryPatch)
);

const getNodePins = def(
  'getNodePins :: Node -> Project -> [Pin]',
  (node, project) => R.compose(
    XF.explode,
    R.map(R.compose(
      Project.normalizePinLabels,
      Project.listPins
    )),
    Project.getPatchByNode(R.__, project)
  )(node)
);

export const getListOfPinData = def(
  'getListOfPinData :: Project -> Node -> [TPin]',
  (project, node) => R.compose(
    R.map((pin) => {
      const pinKey = Project.getPinKey(pin);
      const pinType = Project.getPinType(pin);
      return R.applySpec({
        key: R.always(pinKey),
        type: R.always(pinType),
        isOutput: Project.isOutputPin,
        label: Project.getPinLabel,
        value: Project.getBoundValueOrDefault(R.__, node),
      })(pin);
    }),
    getNodePins
  )(node, project)
);

const getNormalizedPinsByPatchPath = def(
  'getNormalizedPinsByPatchPath :: PatchPath -> Project -> [Pin]',
  R.compose(
    Project.normalizePinLabels,
    Project.listOutputPins,
    Project.getPatchByPathUnsafe
  )
);

const getOutputPinKeyByPath = def(
  'getOutputPinKeyByPath :: PatchPath -> Project -> PinKey',
  R.compose(
    Project.getPinKey,
    R.head,
    getNormalizedPinsByPatchPath
  )
);

export const createConstNode = def(
  'createConstNode :: Project -> Project -> NodeId -> TPin -> Node',
  (origProject, project, nodeId, pin) => {
    const pinType = getTPinType(pin);
    const pinValue = getTPinValue(pin);
    const pinLabel = getTPinLabel(pin);

    const newNodeType = R.prop(pinType, CONST_NODETYPES);
    const newNodeId = `${nodeId}_${pinLabel}`;
    const newOutPinKey = getOutputPinKeyByPath(newNodeType, origProject);

    return R.compose(
      R.assoc('id', newNodeId), // TODO: Replace with `setNodeId` function from `xod-project` or make pure `createNode`?
      Project.setBoundValue(newOutPinKey, pinValue),
      Project.createNode({ x: 0, y: 0 })
    )(newNodeType);
  }
);

export const createConstLink = def(
  'createConstLink :: Project -> Project -> NodeId -> TPin -> Link',
  (origProject, project, nodeId, pin) => {
    const pinType = getTPinType(pin);
    const pinKey = getTPinKey(pin);
    const pinLabel = getTPinLabel(pin);
    const newNodeId = `${nodeId}_${pinLabel}`;
    const newNodeType = R.prop(pinType, CONST_NODETYPES);
    const outPinKey = getOutputPinKeyByPath(newNodeType, origProject);
    return R.compose(
      R.assoc('id', `${newNodeId}-to-${nodeId}`), // TODO: Replace with `setLinkId` function from `xod-project` or make pure `createLink`?
      Project.createLink
    )(pinKey, nodeId, outPinKey, newNodeId);
  }
);

const createConstNodeAndLink = def(
  'createConstNodeAndLink :: Project -> Project -> NodeId -> TPin -> [Patch -> Patch]',
  R.converge(
    (assocNodeFn, assocLinkFn) => [assocNodeFn, assocLinkFn],
    [
      R.compose(
        node => patch => R.compose(Maybe.of, Project.assocNode(node))(patch),
        createConstNode
      ),
      R.compose(
        Project.assocLink,
        createConstLink
      ),
    ]
  )
);

const rejectOccupiedPins = def(
  'rejectOccupiedPins :: Node -> Patch -> [TPin] -> [TPin]',
  (node, patch, pins) => {
    const nodeId = Project.getNodeId(node);
    return R.compose(
      pinKeys => R.reject(
        R.compose(
          XF.isAmong(pinKeys),
          getTPinKey
        ),
        pins
      ),
      R.map(Project.getLinkInputPinKey),
      R.filter(Project.isLinkInputNodeIdEquals(nodeId)),
      Project.listLinksByNode(node)
    )(patch);
  }
);

const createConstantForNode = def(
  'createConstantForNode :: Project -> Project -> Patch -> Node -> [Patch -> Patch]',
  (origProject, project, patch, node) => R.compose(
    R.unnest,
    R.map(createConstNodeAndLink(origProject, project, Project.getNodeId(node))),
    R.filter(isInputTPin),
    rejectOccupiedPins(node, patch),
    getListOfPinData(project)
  )(node)
);

// :: Project -> Patch -> Node[] -> (Patch -> Patch)[]
const createConstants = R.curry((origProject, project, patch, nodes) =>
  R.compose(
    R.flatten,
    R.map(createConstantForNode(origProject, project, patch))
  )(nodes)
);

// :: Project -> Patch -> Patch
export const addConstNodesToPatch = R.curry((origProject, project, patch) => {
  const nodes = Project.listNodes(patch);
  const assocNodesAndLinks = createConstants(origProject, project, patch, nodes);

  return R.compose(
    XF.explode,
    R.reduce(R.flip(R.chain), R.__, assocNodesAndLinks),
    Maybe.of
  )(patch);
});

// :: Path -> Project -> Maybe Patch
export const transformPatch = R.curry((path, origProject, project) =>
  Project.getPatchByPath(path, project)
  .map(addConstNodesToPatch(origProject, project))
);

const isConstantNode = def(
  'isConstantNode :: Node -> Boolean',
  R.compose(
    Project.isConstantPatchPath,
    Project.getNodeType
  )
);

/**
 * We need to copy `xod/core/constant-*` patches, that used in the entry-point patch.
 * So we accept updated patch (with Nodes that points on needed constant patches),
 * copy all needed patches from original Project into flattened one, and then
 * assoc updated patch into flattened project.
 */
const copyConstPatchesAndAssocPatch = def(
  'copyConstPatchesAndAssocPatch :: Patch -> Project -> Project -> Either Error Project',
  (patch, origProject, project) => R.compose(
    R.chain(Project.assocPatch(Project.getPatchPath(patch), patch)),
    R.reduce(R.flip(R.chain), Either.of(project)),
    R.map(R.compose(
      R.converge(
        Project.assocPatch,
        [
          Project.getPatchPath,
          R.identity,
        ]
      ),
      Project.getPatchByPathUnsafe(R.__, origProject),
      Project.getNodeType
    )),
    R.filter(isConstantNode),
    Project.listNodes
  )(patch)
);

export const transformProject = def(
  'transformProject :: PatchPath -> Project -> Project -> Project',
  (path, origProject, project) => R.compose(
    XF.explode,
    R.chain(copyConstPatchesAndAssocPatch(R.__, origProject, project)),
    R.map(Project.renumberNodes),
    transformPatch(path, origProject)
  )(origProject, project)
);

// :: Patch -> Project -> Node -> Node
export const transformNode = R.curry((patch, project, node) => {
  const nodeId = Project.getNodeId(node);
  const type = Project.getNodeType(node);
  const nodePatch = Project.getPatchByPathUnsafe(type, project);
  const nodePins = R.compose(
    Project.normalizePinLabels,
    Project.listPins
  )(nodePatch);

  const newNode = {
    id: nodeId,
    implId: type,
    inputTypes: getInputTypes(nodePins),
    outValues: getOutValues(node, nodePins),
    outLinks: getOutLinks(nodeId, project, patch),
  };

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

        if (Project.isTerminalPatchPath(implId)) {
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
 * - project -- a project
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
      .map(transformProject(opts.path, opts.project))
      .chain((proj) => {
        const entryPatch = Project.getPatchByPathUnsafe(opts.path, proj);
        const impls = extractPatchImpls(opts.impls, proj);
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
