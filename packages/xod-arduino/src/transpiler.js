import * as R from 'ramda';
import { Either } from 'ramda-fantasy';

import { explodeMaybe, reverseLookup } from 'xod-func-tools';
// TODO: rename to XP
import * as Project from 'xod-project';
import { def } from './types';

import { renderProject } from './templates';
import { DEFAULT_TRANSPILATION_OPTIONS } from './constants';

import {
  areTimeoutsEnabled,
  isNodeIdEnabled,
  isDirtienessEnabled,
} from './directives';

//-----------------------------------------------------------------------------
//
// Utils
//
//-----------------------------------------------------------------------------

// :: x -> Number
const toInt = R.flip(parseInt)(10);

const kebabToSnake = R.replace(/-/g, '_');

const createPatchNames = def(
  'createPatchNames :: PatchPath -> { owner :: String, libName :: String, patchName :: String }',
  R.compose(
    R.map(kebabToSnake),
    R.ifElse(
      R.startsWith(['@']),
      parts => ({
        owner: '',
        libName: '',
        patchName: parts.slice(1).join('/'),
      }),
      parts => ({
        owner: parts[0],
        libName: parts[1],
        patchName: parts.slice(2).join('/'),
      })
    ),
    R.split('/')
  )
);

const findPatchByPath = def(
  'findPatchByPath :: PatchPath -> [TPatch] -> TPatch',
  (path, patches) =>
    R.compose(
      R.find(R.__, patches),
      R.allPass,
      R.map(R.apply(R.propEq)),
      R.toPairs,
      createPatchNames
    )(path)
);

const getLinksInputNodeIds = def(
  'getLinksInputNodeIds :: [Link] -> [TNodeId]',
  R.compose(R.uniq, R.map(R.compose(toInt, Project.getLinkInputNodeId)))
);

const getPatchByNodeId = def(
  'getPatchByNodeId :: Project -> PatchPath -> [TPatch] -> NodeId -> TPatch',
  (project, entryPath, patches, nodeId) =>
    R.compose(
      findPatchByPath(R.__, patches),
      Project.getNodeType,
      Project.getNodeByIdUnsafe(nodeId),
      Project.getPatchByPathUnsafe
    )(entryPath, project)
);

const toposortProject = def(
  'toposortProject :: PatchPath -> Project -> Either Error Object',
  (path, project) =>
    R.compose(
      R.chain(nodeIdsMap =>
        R.compose(
          R.map(
            R.applySpec({
              project: R.identity,
              nodeIdsMap: R.always(nodeIdsMap),
            })
          ),
          () =>
            Project.updatePatch(
              path,
              Project.applyNodeIdMap(R.__, nodeIdsMap),
              project
            )
        )(nodeIdsMap)
      ),
      Project.getTopologyMap,
      Project.getPatchByPathUnsafe
    )(path, project)
);

//-----------------------------------------------------------------------------
//
// Transformers
//
//-----------------------------------------------------------------------------

const createTPatches = def(
  'createTPatches :: PatchPath -> Project -> [TPatch]',
  (entryPath, project) =>
    R.compose(
      R.values,
      R.mapObjIndexed((patch, path) => {
        const names = createPatchNames(path);
        const impl = explodeMaybe(
          `Implementation for ${path} not found`,
          Project.getImpl(patch)
        );

        const isDirtyable = pin =>
          Project.getPinType(pin) === Project.PIN_TYPE.PULSE ||
          isDirtienessEnabled(impl, `${pin.direction}_${pin.label}`);

        const outputs = R.compose(
          R.map(
            R.applySpec({
              type: Project.getPinType,
              pinKey: Project.getPinLabel,
              value: R.compose(Project.defaultValueOfType, Project.getPinType),
              isDirtyable,
              isDirtyOnBoot: R.compose(
                R.not,
                R.equals(Project.PIN_TYPE.PULSE),
                Project.getPinType
              ),
            })
          ),
          Project.normalizePinLabels,
          Project.listOutputPins
        )(patch);

        const inputs = R.compose(
          R.map(
            R.applySpec({
              type: Project.getPinType,
              pinKey: Project.getPinLabel,
              isDirtyable,
            })
          ),
          Project.normalizePinLabels,
          Project.listInputPins
        )(patch);

        const isThisIsThat = {
          isDefer: Project.isDeferNodeType(path),
          isConstant: Project.isConstantNodeType(path),
          usesTimeouts: areTimeoutsEnabled(impl),
          usesNodeId: isNodeIdEnabled(impl),
        };

        return R.mergeAll([
          names,
          isThisIsThat,
          {
            outputs,
            inputs,
            impl,
          },
        ]);
      }),
      R.omit([entryPath]),
      R.indexBy(Project.getPatchPath),
      Project.listPatchesWithoutBuiltIns
    )(project)
);

const getPinLabelsMap = def(
  'getPinLabelsMap :: [Pin] -> Map PinKey PinLabel',
  R.compose(R.map(Project.getPinLabel), R.indexBy(Project.getPinKey))
);

const getNodePinsUnsafe = def(
  'getNodePinsUnsafe :: Node -> Project -> [Pin]',
  (node, project) =>
    R.compose(
      explodeMaybe(
        `Can’t get node pins of node ${node}. Referred type missing?`
      ),
      Project.getNodePins
    )(node, project)
);

const getNodePinLabels = def(
  'getNodePinLabels :: Node -> Project -> Map PinKey PinLabel',
  R.compose(getPinLabelsMap, Project.normalizePinLabels, getNodePinsUnsafe)
);

// TODO: Remove it when `Project.getBoundValue` will return default values
/**
 * In case when `getBoundValue` doesn't contain a bound value
 * we have to fallback to default pin value.
 */
const getDefaultPinValue = def(
  'getDefaultPinValue :: PinKey -> Node -> Project -> DataValue',
  (pinKey, node, project) =>
    R.compose(
      explodeMaybe(`Can’t find pin with key ${pinKey} for node ${node}"`),
      R.map(R.compose(Project.defaultValueOfType, Project.getPinType)),
      R.chain(Project.getPinByKey(pinKey)),
      Project.getPatchByNode(R.__, project)
    )(node)
);

const getTNodeOutputs = def(
  'getTNodeOutputs :: Project -> PatchPath -> Node -> [TNodeOutput]',
  (project, entryPath, node) => {
    const nodeId = Project.getNodeId(node);
    const nodePins = getNodePinLabels(node, project);

    return R.compose(
      R.values,
      R.mapObjIndexed((links, pinKey) => ({
        to: getLinksInputNodeIds(links),
        pinKey: nodePins[pinKey],
        value: Project.getBoundValue(pinKey, node).getOrElse(
          getDefaultPinValue(pinKey, node, project)
        ),
      })),
      R.groupBy(Project.getLinkOutputPinKey),
      R.filter(Project.isLinkOutputNodeIdEquals(nodeId)),
      Project.listLinksByNode(node),
      Project.getPatchByPathUnsafe
    )(entryPath, project);
  }
);

const getOutputPinLabelByLink = def(
  'getOutputPinLabelByLink :: Project -> Patch -> Link -> PinLabel',
  (project, patch, link) => {
    const pinKey = Project.getLinkOutputPinKey(link);
    return R.compose(
      explodeMaybe(
        `Can’t find pin with key ${pinKey} for link ${link} on patch ${patch}`
      ),
      R.map(
        R.compose(Project.getPinLabel, R.head, Project.normalizePinLabels, R.of)
      ),
      R.chain(Project.getPinByKey(pinKey)),
      R.chain(Project.getPatchByNode(R.__, project)),
      Project.getNodeById(R.__, patch),
      Project.getLinkOutputNodeId
    )(link);
  }
);

const getTPatchOutputByLabel = def(
  'getTPatchOutputByLabel :: PinLabel -> TPatch -> TPatchOutput',
  (pinLabel, tpatch) => R.find(R.propEq('pinKey', pinLabel), tpatch.outputs)
);

const getTNodeInputs = def(
  'getTNodeInputs :: Project -> PatchPath -> [TPatch] -> Node -> [TNodeInput]',
  (project, entryPath, patches, node) => {
    const patch = Project.getPatchByPathUnsafe(entryPath, project);
    const nodeId = Project.getNodeId(node);
    const nodePins = getNodePinLabels(node, project);

    // :: Link -> TPatch
    const getUpstreamNodePatch = R.compose(
      getPatchByNodeId(project, entryPath, patches),
      Project.getLinkOutputNodeId
    );

    // :: Link -> PinLabel
    const getUpstreamPinLabel = getOutputPinLabelByLink(project, patch);

    // :: Link -> TNodeInput
    const constructTNodeInput = R.applySpec({
      pinKey: R.compose(R.prop(R.__, nodePins), Project.getLinkInputPinKey),
      fromNodeId: R.compose(toInt, Project.getLinkOutputNodeId),
      fromPatch: getUpstreamNodePatch,
      fromPinKey: getUpstreamPinLabel,
      fromOutput: R.converge(getTPatchOutputByLabel, [
        getUpstreamPinLabel,
        getUpstreamNodePatch,
      ]),
    });

    return R.compose(
      R.map(constructTNodeInput),
      R.filter(Project.isLinkInputNodeIdEquals(nodeId)),
      Project.listLinksByNode(node)
    )(patch);
  }
);

const createTNodes = def(
  'createTNodes :: PatchPath -> [TPatch] -> Map NodeId String -> Project -> [TNode]',
  (entryPath, patches, nodeIdsMap, project) =>
    R.compose(
      R.sortBy(R.prop('id')),
      R.map(
        R.applySpec({
          id: R.compose(toInt, Project.getNodeId),
          originalId: R.compose(
            reverseLookup(R.__, nodeIdsMap),
            Project.getNodeId
          ),
          patch: R.compose(findPatchByPath(R.__, patches), Project.getNodeType),
          outputs: getTNodeOutputs(project, entryPath),
          inputs: getTNodeInputs(project, entryPath, patches),
        })
      ),
      Project.listNodes,
      Project.getPatchByPathUnsafe
    )(entryPath, project)
);

/**
 * Transforms Project into TProject.
 * TProject is an object, that ready to be passed into renderer (handlebars)
 * and it has a ready-to-use values, nothing needed to compute anymore.
 */
const transformProjectWithImpls = def(
  'transformProjectWithImpls :: Project -> PatchPath -> TranspilationOptions -> Either Error TProject',
  (project, path, opts) =>
    R.compose(
      R.chain(tProject => {
        const nodeWithTooManyOutputs = R.find(
          R.pipe(R.prop('outputs'), R.length, R.lt(7)),
          tProject.patches
        );

        if (nodeWithTooManyOutputs) {
          const { owner, libName, patchName } = nodeWithTooManyOutputs;
          return Either.Left(
            new Error(
              `Native node ${owner}/${libName}/${patchName} has more than 7 outputs`
            )
          );
        }

        return Either.of(tProject);
      }),
      R.map(({ project: proj, nodeIdsMap }) => {
        const patches = createTPatches(path, proj);

        return R.merge(
          {
            config: { XOD_DEBUG: opts.debug },
          },
          R.applySpec({
            patches: R.always(patches),
            nodes: createTNodes(path, patches, nodeIdsMap),
          })(proj)
        );
      }),
      R.chain(
        R.compose(
          toposortProject(path),
          Project.extractBoundInputsToConstNodes(R.__, path, project)
        )
      ),
      R.chain(Project.flatten(R.__, path)),
      R.unless(
        () => opts.debug,
        R.chain(Project.updatePatch(path, Project.removeDebugNodes))
      ),
      Project.validateProject
    )(project)
);

export const getNodeIdsMap = def(
  'getNodeIdsMap :: TProject -> Map NodeId String',
  R.compose(
    R.fromPairs,
    R.map(node => [node.originalId, String(node.id)]),
    R.prop('nodes')
  )
);

export const transformProject = def(
  'transformProject :: Project -> PatchPath -> Either Error TProject',
  (project, patchPath) =>
    transformProjectWithImpls(project, patchPath, DEFAULT_TRANSPILATION_OPTIONS)
);

export const transformProjectWithDebug = def(
  'transformProjectWithDebug :: Project -> PatchPath -> Either Error TProject',
  (project, patchPath) => {
    const options = R.merge(DEFAULT_TRANSPILATION_OPTIONS, {
      debug: true,
    });
    return transformProjectWithImpls(project, patchPath, options);
  }
);

export const transpile = renderProject;

export const forUnitTests = {
  createPatchNames,
};
