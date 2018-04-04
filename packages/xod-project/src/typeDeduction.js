import * as R from 'ramda';
import { Maybe } from 'ramda-fantasy';
import { foldEither, catMaybies } from 'xod-func-tools';

import * as Link from './link';
import * as Node from './node';
import * as Patch from './patch';
import * as Project from './project';
import * as Pin from './pin';
import * as Utils from './utils';
import { def } from './types';

// :: NodeId -> PinKey -> DeducedPinTypes -> (DataType -> Maybe DataType)
const maybeGetTypeFromPreviouslyDeduced = R.curry(
  (nodeId, pinKey, previouslyDeducedPinTypes) =>
    R.ifElse(
      Utils.isGenericType,
      () =>
        R.pathOr(Maybe.Nothing(), [nodeId, pinKey], previouslyDeducedPinTypes),
      Maybe.of
    )
);

// :: DeducedPinTypes -> (NodeId -> Patch) -> [Link] -> [(PinKey, DataType)]
const getPinTypesFromLinks = (
  getOutwardNodeIdFromLink, // outputs for top-down pass, inputs for bottom-up pass
  getOutwardPinKeyFromLink,
  getOwnPinKeyFromLink,
  previouslyDeducedTypes,
  getPatchByNodeId,
  linksToNode
) =>
  R.compose(
    catMaybies,
    R.map(link => {
      const outwardNodeId = getOutwardNodeIdFromLink(link);
      const outwardPinKey = getOutwardPinKeyFromLink(link);

      // :: Maybe (PinKey, DataType)
      return R.compose(
        R.map(R.pair(getOwnPinKeyFromLink(link))),
        R.chain(
          maybeGetTypeFromPreviouslyDeduced(
            outwardNodeId,
            outwardPinKey,
            previouslyDeducedTypes
          )
        ),
        R.map(Pin.getPinType),
        Patch.getPinByKey(outwardPinKey),
        getPatchByNodeId
      )(outwardNodeId);
    })
  )(linksToNode);

const getPinKeysByGenericType = patch =>
  R.compose(
    R.map(R.map(Pin.getPinKey)),
    R.groupBy(Pin.getPinType),
    R.filter(Pin.isGenericPin),
    Patch.listPins
  )(patch);

// returns Map NodeId (Map PinKey (Maybe DataType))
const deducePinTypesForNode = (
  abstractNodeId,
  getPatchByNodeId,
  previouslyDeducedPinTypes,
  pinTypesFromLinks
) => {
  const abstractPatch = getPatchByNodeId(abstractNodeId);
  // :: Map DataType [PinKey]
  const pinKeysByGenericType = getPinKeysByGenericType(abstractPatch);

  // :: Map PinKey (Maybe DataType)
  const previouslyDeducedPinTypesForNode = R.propOr(
    {},
    abstractNodeId,
    previouslyDeducedPinTypes
  );

  return R.compose(
    R.reduce(
      R.mergeWith(
        // Nothing means there are are contradictions
        (a, b) => (a.equals(b) ? a : Maybe.Nothing())
      ),
      {}
    ),
    R.append(previouslyDeducedPinTypesForNode),
    R.map(R.map(Maybe.of)),
    // convert from [(PinKey, DataType)] to [Map PinKey DataType]
    // and propagate detected types to all pins with the same generic type
    catMaybies,
    R.map(([pinKey, dataType]) =>
      R.compose(
        // :: Maybe (Map PinKey DataType)
        R.map(
          R.ifElse(
            Utils.isGenericType, // TODO: filter out connections to generic pins earlier?
            // for example, if pins A and B are t1, and we discovered
            // that A is a number, mark B as a number as well
            R.compose(
              R.fromPairs,
              R.map(pk => [pk, dataType]),
              R.propOr([], R.__, pinKeysByGenericType)
            ),
            R.always(R.objOf(pinKey, dataType))
          )
        ),
        R.map(Pin.getPinType), // :: Maybe DataType
        Patch.getPinByKey(pinKey) // :: Maybe Pin
      )(abstractPatch)
    )
  )(pinTypesFromLinks);
};

// Filters out intermediate(outputs for strong resolution, inputs for weak) ambiguous pins,
// which we needed only during resolving process.
// :: Map NodeId (Map PinKey (Maybe DataType)) -> Map NodeId (Map PinKey (Maybe DataType))
const omitIntermediateAmbiguousPins = (
  getPatchByNodeId,
  listIntermediatePins
) =>
  R.mapObjIndexed((pinTypes, nodeId) =>
    R.compose(
      R.omit(R.__, pinTypes),
      R.filter(
        R.pipe(R.propOr(Maybe.Nothing(), R.__, pinTypes), Maybe.isNothing)
      ),
      R.map(Pin.getPinKey),
      listIntermediatePins,
      getPatchByNodeId
    )(nodeId)
  );

export const deducePinTypes = def(
  'deducePinTypes :: Patch -> Project -> DeducedPinTypes',
  (patch, project) => {
    // :: NodeId -> Patch
    const getPatchByNodeId = Project.getPatchByNodeIdUnsafe(
      R.__,
      patch,
      project
    );

    // :: [Node]
    const toposortedAbstractNodes = R.compose(
      R.filter(
        R.compose(Patch.isAbstractPatch, getPatchByNodeId, Node.getNodeId)
      ),
      catMaybies,
      R.map(Patch.getNodeById(R.__, patch)), // :: [Maybe Node]
      foldEither(R.always([]), R.identity), // :: [NodeId]
      Patch.getTopology // :: Either Error [NodeId]
    )(patch);

    const abstractNodeIds = R.map(Node.getNodeId, toposortedAbstractNodes);

    // :: Map NodeId [Link]
    const linksByInputNodeId = R.compose(
      R.groupBy(Link.getLinkInputNodeId),
      Patch.listLinks
    )(patch);

    // :: Map NodeId (Map PinKey (Maybe DataType))
    // Maybe DataType is Just when type is resolved, and Nothing if it can not be decided.
    const stronglyResolvedTypes = R.compose(
      R.reject(R.isEmpty),
      R.reduce((previouslyDeducedPinTypes, abstractNodeId) => {
        const linksToNode = R.propOr([], abstractNodeId, linksByInputNodeId);

        // :: [(PinKey, DataType)]
        const pinTypesFromLinks = getPinTypesFromLinks(
          Link.getLinkOutputNodeId,
          Link.getLinkOutputPinKey,
          Link.getLinkInputPinKey,
          previouslyDeducedPinTypes,
          getPatchByNodeId,
          linksToNode
        );

        // :: Map PinKey (Maybe DataType)
        const deducedPinTypesForNode = deducePinTypesForNode(
          abstractNodeId,
          getPatchByNodeId,
          previouslyDeducedPinTypes,
          pinTypesFromLinks
        );

        return R.assoc(
          abstractNodeId,
          deducedPinTypesForNode,
          previouslyDeducedPinTypes
        );
      }, {})
    )(abstractNodeIds);

    const linksByOutputNodeId = R.compose(
      R.groupBy(Link.getLinkOutputNodeId),
      Patch.listLinks
    )(patch);

    const weaklyResolvedTypes = R.compose(
      R.reject(R.isEmpty),
      R.reduceRight((abstractNodeId, previouslyDeducedPinTypes) => {
        const linksFromNode = R.compose(
          // reject links to already resolved
          R.filter(
            R.compose(
              R.isNil,
              pinKey => R.path([abstractNodeId, pinKey], stronglyResolvedTypes),
              Link.getLinkOutputPinKey
            )
          ),
          R.propOr([], abstractNodeId)
        )(linksByOutputNodeId);

        // :: [(PinKey, DataType)]
        const pinTypesFromLinks = getPinTypesFromLinks(
          Link.getLinkInputNodeId,
          Link.getLinkInputPinKey,
          Link.getLinkOutputPinKey,
          previouslyDeducedPinTypes,
          getPatchByNodeId,
          linksFromNode
        );

        // :: Map PinKey (Maybe DataType)
        const deducedPinTypesForNode = deducePinTypesForNode(
          abstractNodeId,
          getPatchByNodeId,
          previouslyDeducedPinTypes,
          pinTypesFromLinks
        );

        return R.assoc(
          abstractNodeId,
          deducedPinTypesForNode,
          previouslyDeducedPinTypes
        );
      }, {})
    )(abstractNodeIds);

    return R.useWith(R.mergeWith(R.merge), [
      omitIntermediateAmbiguousPins(getPatchByNodeId, Patch.listOutputPins),
      omitIntermediateAmbiguousPins(getPatchByNodeId, Patch.listInputPins),
    ])(stronglyResolvedTypes, weaklyResolvedTypes);
  }
);

export default {};
