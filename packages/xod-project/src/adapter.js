/* eslint-disable new-cap */

import R from 'ramda';
import { Maybe } from 'ramda-fantasy';

import * as Project from './project';
import * as Patch from './patch';
import * as Node from './node';
import * as Link from './link';

// utils
const apOrSkip = R.curry((maybeFn, val) => {
  const maybeVal = Maybe(val);
  const result = maybeFn.ap(maybeVal);
  return Maybe.isJust(result) ? result : maybeVal;
});

const propValues = key => R.compose(R.values, R.propOr({}, key));
const applyArrayOfFunctions = R.compose(
  R.apply(R.compose),
  R.append(R.identity),
  R.values
);

// old bundle getters
const mergePatchesAndNodeTypes = R.compose(
  R.values,
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

const addLabel = oldPatch => Maybe(getLabel(oldPatch)).map(Patch.setPatchLabel);
const assocPatchUnsafe = R.curry(
  (path, patch, project) => R.assocPath(['patches', path], patch, project)
);

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
  const getPatchesWithLinks = R.curry((newBundle, patches) =>
    R.map(R.converge(
      R.compose(
        R.unnest,
        R.reduce(R.flip(R.chain))
      ),
      [
        R.compose(
          Project.getPatchByPath(R.__, newBundle),
          R.prop('id')
        ),
        convertLinks,
      ]
    ))(patches)
  );
  // :: BundleV1 -> BundleV2 -> BundleV2
  // -- we can use commented lines when we fix next todo
  // TODO: Add pins from nodeTypes into patches before add links!
  const convertLinksInPatches = R.curry(
    (oldBundle, newBundle) => R.compose(
      R.reduce(
        // -- R.flip(R.chain),
        // -- Maybe.of(newBundle)
        R.flip(R.call),
        newBundle
      ),
      R.map(R.converge(
        // -- Project.assocPatch,
        assocPatchUnsafe,
        [
          R.head,
          R.last,
        ]
      )),
      R.converge(
        R.zip,
        [
          R.map(R.prop('id')),
          getPatchesWithLinks(newBundle),
        ]
      ),
      mergePatchesAndNodeTypes
    )(oldBundle)
  );
  // :: Patch -> Function
  const copyImpls = R.compose(
    R.map(R.assoc('impls')),
    Maybe,
    R.when(
      R.isEmpty,
      R.always(null)
    ),
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
  // :: Project -> Function
  const convertPatches = R.compose(
    applyArrayOfFunctions,
    R.map(oldPatch => Maybe.of(Patch.createPatch())
      .chain(apOrSkip(addLabel(oldPatch)))
      .map(convertNodes(oldPatch))
      .chain(apOrSkip(copyImpls(oldPatch)))
      .chain(assocPatchUnsafe(oldPatch.id))
    ),
    mergePatchesAndNodeTypes
  );

  return Maybe.of(Project.createProject())
    .chain(apOrSkip(appendAuthor(bundle)))
    .map(convertPatches(bundle))
    .map(convertLinksInPatches(bundle))
    .chain(R.identity);
};
