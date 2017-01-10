/* eslint-disable new-cap */

import R from 'ramda';
import { Maybe } from 'ramda-fantasy';

import * as Project from './project';
import * as Patch from './patch';
import * as Node from './node';

// utils
const apOrSkip = R.curry((maybeFn, maybeValue) => {
  const result = maybeFn.ap(maybeValue);
  return Maybe.isJust(result) ? result : maybeValue;
});
const propValues = key => R.compose(R.values, R.propOr({}, key));
const arrayToFunction = R.compose(
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

const assocPatchUnsafe = R.curry(
  (path, patch, project) => R.assocPath(['patches', path], patch, project)
);

/**
 * Transforms old project bundle (v1) into new (v2)
 * @param {object} bundle
 * @returns {object}
 */
export const toV2 = (bundle) => {
  // :: Node -> Function
  const convertNodePins = R.compose(
    arrayToFunction,
    R.mapObjIndexed((pin, key) => {
      const setCurryPin = Maybe(pin.injected).map(Node.curryPin(key));
      const setPinValue = Maybe(pin.value).map(Node.setPinCurriedValue(key));
      return R.compose(
        R.chain(R.identity),
        apOrSkip(setPinValue),
        apOrSkip(setCurryPin),
        Maybe
      );
    }),
    R.prop('pins')
  );
  // :: Patch -> Function
  const convertNodes = R.compose(
    arrayToFunction,
    R.map(oldNode => {
      const position = oldNode.position;
      const type = oldNode.typeId;

      return Node.createNode(position, type)
      .map(convertNodePins(oldNode))
      .chain(Patch.assocNode);
    }),
    getNodes
  );
  // :: Project -> Function
  const convertPatches = R.compose(
    arrayToFunction,
    R.map(oldPatch => {
      const addLabel = Maybe(getLabel(oldPatch)).map(Patch.setPatchLabel);

      return Maybe.of(Patch.createPatch())
        .chain(patch => apOrSkip(addLabel, Maybe.of(patch)))
        .map(convertNodes(oldPatch))
        .chain(assocPatchUnsafe(oldPatch.id));
    }),
    mergePatchesAndNodeTypes
  );

  return Maybe.of(Project.createProject())
    .map(convertPatches(bundle))
    .chain(R.identity);
};
