import R from 'ramda';
import { Maybe } from 'ramda-fantasy';

import * as Project from './project';
import * as Patch from './patch';
import * as Node from './node';
import * as Link from './link';
import * as Pin from './pin';

// ================================================
//
// Utility functions
//
// ================================================

// :: Maybe Function -> a -> Maybe a
const apOrSkip = R.curry((maybeFn, val) => {
  const maybeVal = Maybe(val);
  const result = maybeFn.ap(maybeVal);
  return Maybe.isJust(result) ? result : maybeVal;
});
// :: a -> Maybe a
const maybeEmpty = R.ifElse(
  R.isEmpty,
  Maybe.Nothing,
  Maybe.of
);

// :: a -> [Function fn] -> a
// fn :: a -> Applicative a
// For example,
//   const t = key => R.compose(Maybe, R.assoc(key, true));
//   reduceChainOver({}, [t('a'), t('b')]);
//   { 'a': true, 'b': true }
const reduceChainOver = R.curry((overObj, fnList) =>
  R.compose(
    R.unnest,
    R.reduce(R.flip(R.chain), Maybe.of(overObj))
  )(fnList)
);

// :: String -> Object -> [a]
const propValues = key => R.compose(R.values, R.propOr({}, key));

// :: [Function] -> Function fn
// fn :: a -> a
const applyArrayOfFunctions = R.ifElse(
  R.isEmpty,
  R.always(R.identity),
  R.apply(R.compose)
);


// ================================================
//
// Getters from old bundle
//
// ================================================

// :: Project -> [Patch ^ NodeType]
export const mergePatchesAndNodeTypes = R.converge(
  R.mergeWith(R.merge),
  [
    R.prop('patches'),
    R.prop('nodeTypes'),
  ]
);

// :: {} -> String
const getLabel = R.prop('label');
// :: {} -> [a]
const getNodes = propValues('nodes');
// :: {} -> [a]
const getLinks = propValues('links');


// ================================================
//
// Conversion functions
//
// ================================================

// :: Path -> Patch -> Project -> Project
const assocPatchUnsafe = R.curry(
  (path, patch, project) => R.assocPath(['patches', path], patch, project)
);

// :: Patch -> Maybe fn
// fn :: Patch -> Patch
const addLabel = oldPatch => Maybe(getLabel(oldPatch)).map(Patch.setPatchLabel);

// :: String -> String
export const convertPinType = R.cond([
  [R.equals('bool'), R.always('boolean')],
  [R.T, R.identity],
]);

// :: Node -> Node
const updateNodeIdMap = R.curry((nodeIdMap, oldNode, newNode) => {
  nodeIdMap[oldNode.id] = newNode.id; // eslint-disable-line
  return newNode;
});

// :: NodeIdMap -> String -> String
const getLinkNodeId = R.flip(R.prop);

// :: NodeIdMap -> String -> String
const getLinkPin = R.ifElse(
  R.flip(R.has),
  getLinkNodeId,
  R.nthArg(1)
);

// :: NodeOld -> Function fn
// fn :: Node -> Node
const convertNodePins = R.compose(
  applyArrayOfFunctions,
  R.values,
  R.mapObjIndexed((pin, key) => {
    const setCurryPin = Maybe(pin.injected).map(Node.curryPin(key));
    const setPinValue = Maybe(pin.value).map(Node.setPinCurriedValue(key));
    return R.compose(
      R.chain(R.identity),
      R.chain(apOrSkip(setPinValue)),
      apOrSkip(setCurryPin)
    );
  }),
  R.prop('pins')
);

// :: NodeIdMap -> PatchOld -> Function fn
// fn :: Patch -> Patch
const convertNodes = R.curry((nodeIdMap, patchOld) =>
  R.compose(
    applyArrayOfFunctions,
    R.map(oldNode => Node.createNode(oldNode.position, oldNode.typeId)
      .map(updateNodeIdMap(nodeIdMap, oldNode))
      .map(convertNodePins(oldNode))
      .chain(Patch.assocNode)
    ),
    getNodes
  )(patchOld)
);

// :: NodeIdMap -> PatchOld -> Function fn
// fn :: Patch -> Patch
const convertLinks = nodeIdMap => R.compose(
  R.map(R.compose(
    Patch.assocLink,
    R.converge(
      Link.createLink,
      [
        R.compose(getLinkPin(nodeIdMap), R.prop('pinKey'), R.head),
        R.compose(getLinkNodeId(nodeIdMap), R.prop('nodeId'), R.head),
        R.compose(getLinkPin(nodeIdMap), R.prop('pinKey'), R.last),
        R.compose(getLinkNodeId(nodeIdMap), R.prop('nodeId'), R.last),
      ]
    ),
    R.prop('pins')
  )),
  getLinks
);

// :: Project -> PatchOld -> Patch
const getPatchByOldPatch = project => R.compose(
  R.unnest,
  Project.getPatchByPath(R.__, project),
  R.prop('id')
);

// :: Project -> [PatchOld] -> [Patch]
const getPatchesWithLinks = R.curry(
  (nodeIdMap, project) => R.map(R.converge(
    reduceChainOver,
    [
      getPatchByOldPatch(project),
      convertLinks(nodeIdMap),
    ]
  ))
);

// :: NodeIdMap -> ProjectOld -> Project -> Project
const convertLinksInPatches = R.curry(
  (nodeIdMap, projectOld, project) => R.compose(
    reduceChainOver(project),
    R.map(R.apply(Project.assocPatch)),
    R.converge(
      R.zip,
      [
        R.map(R.prop('id')),
        getPatchesWithLinks(nodeIdMap, project),
      ]
    ),
    R.values,
    mergePatchesAndNodeTypes
  )(projectOld)
);

// :: PatchOld -> Function fn
// fn :: Patch -> Patch
const copyImpls = R.compose(
  R.map(R.assoc('impls')),
  maybeEmpty,
  R.prop('impl')
);

// :: ProjectOld -> Maybe Function fn
// fn :: Project -> Project
const appendAuthor = R.compose(
  R.map(R.compose(
    R.over(R.lensProp('authors')),
    R.append
  )),
  Maybe,
  R.path(['meta', 'author'])
);

// :: Patch -> Pin[]
const getCustomPinsOnly = R.compose(
  R.reject(R.has('nodeId')),
  propValues('pins')
);

// :: PatchOld -> Function fn
// fn :: Patch -> Patch
const convertPatchPins = R.compose(
  R.flip(reduceChainOver),
  R.when(
    Maybe.isNothing,
    R.always([R.identity])
  ),
  R.chain(R.compose(
    R.map(R.compose(
      R.chain(Patch.assocPin),
      R.converge(
        Pin.createPin,
        [
          R.prop('key'),
          R.compose(convertPinType, R.prop('type')),
          R.prop('direction'),
        ]
      )
    )),
    R.values
  )),
  maybeEmpty,
  getCustomPinsOnly
);

// :: NodeIdMap -> ProjectOld -> Function fn
// fn :: Project -> Project
const convertPatches = R.curry((nodeIdMap, projectOld) =>
  R.compose(
    applyArrayOfFunctions,
    R.map(oldPatch => Maybe.of(Patch.createPatch())
      .chain(apOrSkip(addLabel(oldPatch)))
      .map(convertPatchPins(oldPatch))
      .map(convertNodes(nodeIdMap, oldPatch))
      .chain(apOrSkip(copyImpls(oldPatch)))
      .chain(assocPatchUnsafe(oldPatch.id))
    ),
    R.values,
    mergePatchesAndNodeTypes
  )(projectOld)
);

/**
 * Transforms old project bundle (v1) into new (v2)
 * @param {object} bundle
 * @returns {Project}
 */
export const toV2 = (bundle) => {
  const nodeIdMap = {};

  return Maybe.of(Project.createProject())
    .chain(apOrSkip(appendAuthor(bundle)))
    .map(convertPatches(nodeIdMap, bundle))
    .map(convertLinksInPatches(nodeIdMap, bundle))
    .chain(R.identity);
};
