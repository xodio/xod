/* eslint-disable new-cap */

import R from 'ramda';
import { Maybe } from 'ramda-fantasy';

import * as Project from './project';
import * as Patch from './patch';
import * as Node from './node';
import * as Link from './link';
import * as Pin from './pin';

// utils
// :: Maybe<Function> -> a -> Maybe<a>
const apOrSkip = R.curry((maybeFn, val) => {
  const maybeVal = Maybe(val);
  const result = maybeFn.ap(maybeVal);
  return Maybe.isJust(result) ? result : maybeVal;
});
// :: a -> a | null
const nullOnEmpty = R.when(
  R.isEmpty,
  R.always(null)
);
// :: a -> [Function] -> a
const reduceChainOver = R.curry((overObj, fnList) =>
  R.compose(
    R.unnest,
    R.reduce(R.flip(R.chain), Maybe.of(overObj))
  )(fnList)
);
// :: String -> Object -> [a]
const propValues = R.curry((key, obj) => R.compose(R.values, R.propOr({}, key))(obj));

// :: [Function] -> Function
const applyArrayOfFunctions = R.compose(
  R.apply(R.compose),
  R.append(R.identity),
  R.values
);

// Getters from old bundle
// :: Project -> [Patch ^ NodeType]
export const mergePatchesAndNodeTypes = R.compose(
  R.converge(
    R.mergeWith(R.merge),
    [
      R.prop('patches'),
      R.prop('nodeTypes'),
    ]
  )
);

const getLabel = R.prop('label');
const getNodes = propValues('nodes');
const getLinks = propValues('links');

// Setters for new bundle
// :: Patch -> Maybe<Function>
const addLabel = oldPatch => Maybe(getLabel(oldPatch)).map(Patch.setPatchLabel);
// :: Path -> Patch -> Project ->
const assocPatchUnsafe = R.curry(
  (path, patch, project) => R.assocPath(['patches', path], patch, project)
);
// :: String -> String
export const convertPinType = R.cond([
  [R.equals('bool'), R.always('boolean')],
  [R.T, R.identity],
]);

/**
 * Transforms old project bundle (v1) into new (v2)
 * @param {object} bundle
 * @returns {object}
 */
export const toV2 = (bundle) => {
  const nodeIdMap = {};
  // :: Node -> Node
  const updateNodeIdMap = R.curry((oldNode, newNode) => {
    nodeIdMap[oldNode.id] = newNode.id;
    return newNode;
  });
  // :: Node -> Function
  const convertNodePins = R.compose(
    applyArrayOfFunctions,
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
  // :: Patch -> Function
  const convertNodes = R.compose(
    applyArrayOfFunctions,
    R.map(oldNode => Node.createNode(oldNode.position, oldNode.typeId)
      .map(updateNodeIdMap(oldNode))
      .map(convertNodePins(oldNode))
      .chain(Patch.assocNode)
    ),
    getNodes
  );
  // :: String -> String
  const getLinkNodeId = nodeId => nodeIdMap[nodeId];
  // :: String -> String
  const getLinkPin = pinKey => Maybe(nodeIdMap[pinKey]).getOrElse(pinKey);
  // :: Patch -> Function
  const convertLinks = R.compose(
    R.map(R.compose(
      Patch.assocLink,
      R.converge(
        Link.createLink,
        [
          R.compose(getLinkPin, R.prop('pinKey'), R.head),
          R.compose(getLinkNodeId, R.prop('nodeId'), R.head),
          R.compose(getLinkPin, R.prop('pinKey'), R.last),
          R.compose(getLinkNodeId, R.prop('nodeId'), R.last),
        ]
      ),
      R.prop('pins')
    )),
    getLinks
  );
  // :: Patch[] -> Patch[]
  const getPatchesWithLinks = R.curry((project, patches) =>
    R.map(R.converge(
      reduceChainOver,
      [
        R.compose(
          R.unnest,
          Project.getPatchByPath(R.__, project),
          R.prop('id')
        ),
        convertLinks,
      ]
    ))(patches)
  );
  // :: ProjectOld -> Project -> Project
  const convertLinksInPatches = R.curry(
    (projectOld, project) => R.compose(
      reduceChainOver(project),
      R.map(R.converge(
        Project.assocPatch,
        [
          R.head,
          R.last,
        ]
      )),
      R.converge(
        R.zip,
        [
          R.map(R.prop('id')),
          getPatchesWithLinks(project),
        ]
      ),
      R.values,
      mergePatchesAndNodeTypes
    )(projectOld)
  );
  // :: Patch -> Function
  const copyImpls = R.compose(
    R.map(R.assoc('impls')),
    Maybe,
    nullOnEmpty,
    R.prop('impl')
  );
  // :: Project -> Function
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
  // :: Patch -> Function
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
    Maybe,
    nullOnEmpty,
    getCustomPinsOnly
  );
  // :: Project -> Function
  const convertPatches = R.compose(
    applyArrayOfFunctions,
    R.map(oldPatch => Maybe.of(Patch.createPatch())
      .chain(apOrSkip(addLabel(oldPatch)))
      .map(convertPatchPins(oldPatch))
      .map(convertNodes(oldPatch))
      .chain(apOrSkip(copyImpls(oldPatch)))
      .chain(assocPatchUnsafe(oldPatch.id))
    ),
    R.values,
    mergePatchesAndNodeTypes
  );

  return Maybe.of(Project.createProject())
    .chain(apOrSkip(appendAuthor(bundle)))
    .map(convertPatches(bundle))
    .map(convertLinksInPatches(bundle))
    .chain(R.identity);
};
