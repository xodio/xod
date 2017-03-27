import R from 'ramda';
import { Tuple, Maybe } from 'ramda-fantasy';

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

// TODO: is there a more idiomatic way to do this sort of stuff?
// :: Maybe (a -> a) -> a -> a
// example: maybeApply(Maybe(f), x)
//   will return f(x) if Maybe(f) is Just f
//   or will just return x if Maybe(f) is Nothing
const maybeApply = R.curry((maybeFn, val) => {
  const maybeResult = maybeFn.ap(Maybe.of(val));
  return Maybe.maybe(val, R.identity, maybeResult);
});

// :: a -> Maybe a
const maybeEmpty = R.ifElse(
  R.isEmpty,
  Maybe.Nothing,
  Maybe.of
);

// :: [Function fn] -> a -> a
// fn :: a -> Applicative a
// For example,
//   const t = key => R.compose(Maybe, R.assoc(key, true));
//   reduceChainOver([t('a'), t('b')], {});
//   { 'a': true, 'b': true }
const reduceChainOver = R.curry((fnList, overObj) =>
  R.compose(
    R.unnest,
    R.reduce(R.flip(R.chain), Maybe.of(overObj))
  )(fnList)
);

// :: String -> Object -> [a]
const propValues = key => R.compose(R.values, R.propOr({}, key));

// :: [Function] -> Function fn
// fn :: a -> a
const composeA = R.ifElse(
  R.isEmpty,
  R.always(R.identity),
  R.apply(R.compose)
);

// :: Tuple a (b -> b) -> Tuple a b
const composeT = R.curry((tuple, b) => tuple.map(fn => fn(b)));


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

// :: NodeIdMap -> String -> String
const getLinkNodeId = R.flip(R.prop);

// :: NodeIdMap -> String -> String
const getLinkPin = R.ifElse(
  R.flip(R.has),
  getLinkNodeId,
  R.nthArg(1)
);

// :: NodeIdMap -> Patch -> Patch
const convertNodePins = R.curry((nodeIdMap, patch) =>
  R.over(
    R.lensProp('nodes'),
    R.map(node =>
      R.compose(
        R.assoc('pins', R.__, node),
        R.fromPairs,
        R.map(([key, pin]) => {
          if (R.has(key, nodeIdMap)) {
            return [nodeIdMap[key], pin];
          }
          return [key, pin];
        }),
        R.toPairs,
        R.prop('pins')
      )(node)
    ),
    patch
  )
);

// :: NodeOld -> Function fn
// fn :: Node -> Node
const copyNodePins = R.compose(
  composeA,
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

const mapNodeId = R.curry((oldNode, newNode) => ({ [oldNode.id]: newNode.id }));

// :: PatchOld -> { nodeIdMap :: NodeIdMap, node :: Patch -> Tuple NodeIdMap Patch }
const convertNodes = R.compose(
  composeT,
  R.converge(
    Tuple,
    [
      R.compose(R.mergeAll, R.pluck('nodeIdMap')),
      R.compose(composeA, R.pluck('node')),
    ]
  ),
  R.map(oldNode =>
    R.compose(
      R.evolve({ node: Patch.assocNode }),
      R.evolve({ node: copyNodePins(oldNode) }),
      node => ({ nodeIdMap: mapNodeId(oldNode, node), node }),
      R.apply(Node.createNode),
      R.props(['position', 'typeId'])
    )(oldNode)
  ),
  getNodes
);

// :: NodeIdMap -> PatchOld -> Function fn
// fn :: Patch -> Patch
const convertLinks = nodeIdMap => R.compose(
  R.map(R.compose(
    Patch.assocLink,
    R.converge(
      Link.createLink,
      [
        R.compose(getLinkPin(nodeIdMap), R.prop('pinKey'), R.last),
        R.compose(getLinkNodeId(nodeIdMap), R.prop('nodeId'), R.last),
        R.compose(getLinkPin(nodeIdMap), R.prop('pinKey'), R.head),
        R.compose(getLinkNodeId(nodeIdMap), R.prop('nodeId'), R.head),
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

// :: Tuple NodeIdMap Project -> [PatchOld] -> [Patch]
const getPatchesWithLinks = R.compose(
  R.map,
  R.converge(reduceChainOver),
  R.juxt([
    R.compose(convertLinks, Tuple.fst),
    R.compose(getPatchByOldPatch, Tuple.snd),
  ])
);

// :: ProjectOld -> Tuple NodeIdMap Project -> Project
const convertLinksInPatches = R.curry(
  (projectOld, tuple) => R.compose(
      reduceChainOver(R.__, Tuple.snd(tuple)),
      R.map(R.apply(Project.assocPatch)),
      R.converge(
        R.zip,
        [
          R.map(R.prop('id')),
          getPatchesWithLinks(tuple),
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
  R.propOr({}, 'impl')
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

// :: ProjectOld -> (Project -> Project)
const convertProjectName = R.compose(
  R.assoc('name'),
  R.pathOr('', ['meta', 'name'])
);

// :: Patch -> Pin[]
const getCustomPinsOnly = R.compose(
  R.reject(R.has('nodeId')),
  propValues('pins')
);

// :: PinOld -> Pin
const convertPin = R.converge(Pin.createPin, [
  R.prop('key'),
  R.compose(convertPinType, R.prop('type')),
  R.prop('direction'),
  R.prop('index'),
]);

// :: PatchOld -> (Patch -> Patch)
const convertPatchPins = oldPatch => (patch) => {
  const converter = R.compose(
    f => f(patch),
    R.apply(R.pipe),
    R.map(Patch.assocPin), // list of associators
    R.map(convertPin)
  );

  const customPins = getCustomPinsOnly(oldPatch);
  return customPins.length ? converter(customPins) : patch;
};

// :: ProjectOld -> Function fn
// fn :: Project -> Tuple NodeIdMap Project
const convertPatches = R.compose(
  composeT,
  (futurePatches) => {
    const tuples = R.pluck(1, futurePatches);
    const nodeIdMap = R.compose(
      R.mergeAll,
      R.map(Tuple.fst)
    )(tuples);

    const assocNodes = R.compose(
      composeA,
      R.values,
      R.mapObjIndexed(
        (tup, idx) => R.compose(
          assocPatchUnsafe(futurePatches[idx][0]),
          convertNodePins(nodeIdMap),
          Tuple.snd
        )(tup)
      )
    )(tuples);

    return Tuple(nodeIdMap, assocNodes);
  },
  R.map(oldPatch => Maybe.of(Patch.createPatch())
    .chain(apOrSkip(addLabel(oldPatch)))
    .chain(apOrSkip(copyImpls(oldPatch)))
    .map(convertPatchPins(oldPatch))
    .map(convertNodes(oldPatch))
    .chain(tuple => ([oldPatch.id, tuple]))
  ),
  R.values,
  mergePatchesAndNodeTypes
);

/**
 * Transforms old project bundle (v1) into new (v2)
 * @param {object} bundle
 * @returns {Project}
 */
export const toV2 = bundle =>
  R.compose(
    convertLinksInPatches(bundle),
    convertPatches(bundle),
    convertProjectName(bundle),
    maybeApply(appendAuthor(bundle))
  )(Project.createProject());

