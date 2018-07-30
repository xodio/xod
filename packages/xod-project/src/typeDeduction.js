import * as R from 'ramda';
import { Maybe, Either } from 'ramda-fantasy';
import {
  foldEither,
  foldMaybe,
  explodeMaybe,
  catMaybies,
  setOf,
  inSet,
} from 'xod-func-tools';

import * as Link from './link';
import * as Node from './node';
import * as Patch from './patch';
import * as Project from './project';
import * as Pin from './pin';
import * as Utils from './utils';
import * as PPU from './patchPathUtils';
import { def } from './types';
import { sortGraph } from './gmath';

//
// Pin types deduction
//

// :: NodeId -> PinKey -> DeducedPinTypes -> (DataType -> Maybe DataType)
const maybeGetTypeFromPreviouslyDeduced = R.curry(
  (nodeId, pinKey, previouslyDeducedPinTypes) =>
    R.ifElse(
      Utils.isGenericType,
      () =>
        R.compose(
          foldEither(Maybe.Nothing, Maybe.of),
          R.pathOr(Either.Left([]), [nodeId, pinKey])
        )(previouslyDeducedPinTypes),
      Maybe.of
    )
);

// returns [(PinKey, DataType)]
const getPinTypesFromLinks = (
  getOutwardNodeIdFromLink, // outputs for top-down pass, inputs for bottom-up pass
  getOutwardPinKeyFromLink,
  getOwnPinKeyFromLink,
  previouslyDeducedTypes,
  getPatchByNodeId, // :: NodeId -> Maybe Patch
  linksToNode,
  entryPatch
) =>
  R.compose(
    catMaybies,
    R.map(link => {
      const outwardNodeId = getOutwardNodeIdFromLink(link);
      const outwardPinKey = getOutwardPinKeyFromLink(link);
      const maybeOutwardNode = Patch.getNodeById(outwardNodeId, entryPatch);

      // :: Maybe (PinKey, DataType)
      return R.chain(
        outwardNode =>
          R.compose(
            R.map(R.pair(getOwnPinKeyFromLink(link))),
            R.chain(
              maybeGetTypeFromPreviouslyDeduced(
                outwardNodeId,
                outwardPinKey,
                previouslyDeducedTypes
              )
            ),
            R.map(Pin.getPinType),
            R.chain(Patch.getVariadicPinByKey(outwardNode, outwardPinKey)),
            getPatchByNodeId
          )(outwardNodeId),
        maybeOutwardNode
      );
    })
  )(linksToNode);

const getPinKeysByGenericType = (node, patch) =>
  R.compose(
    R.map(R.map(Pin.getPinKey)),
    R.groupBy(Pin.getPinType),
    R.filter(Pin.isGenericPin),
    Patch.listPinsIncludingVariadics(node)
  )(patch);

const leftIfDifferent = (eitherA, eitherB) =>
  foldEither(
    contradictingAs =>
      foldEither(
        contradictingBs =>
          R.compose(Either.Left, R.uniq, R.concat)(
            contradictingAs,
            contradictingBs
          ),
        okB => R.compose(Either.Left, R.uniq, R.append)(okB, contradictingAs),
        eitherB
      ),
    okA =>
      foldEither(
        contradictingBs =>
          R.compose(Either.Left, R.uniq, R.append)(okA, contradictingBs),
        okB => (okA === okB ? Either.Right(okA) : Either.Left([okA, okB])),
        eitherB
      ),
    eitherA
  );

// returns Map NodeId (Map PinKey (Either [DataType] DataType))
const deducePinTypesForNode = (
  abstractNode,
  getPatchByNodeId,
  previouslyDeducedPinTypes,
  pinTypesFromLinks
) => {
  const abstractNodeId = Node.getNodeId(abstractNode);
  const abstractPatch = R.compose(
    explodeMaybe(
      `Impossible error: at this point patch ${Node.getNodeType(
        abstractNode
      )} is guaranteed to exist`
    ),
    getPatchByNodeId
  )(abstractNodeId);
  // :: Map DataType [PinKey]
  const pinKeysByGenericType = getPinKeysByGenericType(
    abstractNode,
    abstractPatch
  );

  // :: Map PinKey (Either [DataType] DataType)
  const previouslyDeducedPinTypesForNode = R.propOr(
    {},
    abstractNodeId,
    previouslyDeducedPinTypes
  );

  return R.compose(
    R.reduce(R.mergeWith(leftIfDifferent), {}),
    R.append(previouslyDeducedPinTypesForNode),
    R.map(R.map(Either.of)),
    // convert from [(PinKey, DataType)] to [Map PinKey DataType]
    // and propagate detected types to all pins with the same generic type
    catMaybies,
    R.map(([pinKey, dataType]) =>
      R.compose(
        // :: Maybe (Map PinKey DataType)
        R.chain(
          R.ifElse(
            Utils.isGenericType,
            // for example, if pins A and B are t1, and we discovered
            // that A is a number, mark B as a number as well
            R.compose(
              Maybe.of,
              R.fromPairs,
              R.map(pk => [pk, dataType]),
              R.propOr([], R.__, pinKeysByGenericType)
            ),
            // No need to include types of static(non-generic) pins in resolution results.
            // We know them already!
            // TODO: filter out connections to generic pins earlier?
            Maybe.Nothing
          )
        ),
        R.map(Pin.getPinType), // :: Maybe DataType
        Patch.getVariadicPinByKey(abstractNode, pinKey) // :: Maybe Pin
      )(abstractPatch)
    )
  )(pinTypesFromLinks);
};

// Filters out intermediate(outputs for strong resolution, inputs for weak) ambiguous pins,
// which we needed only during resolving process.
// :: Map NodeId (Map PinKey (Either [DataType] DataType)) -> Map NodeId (Map PinKey (Either [DataType] DataType))
const omitIntermediateAmbiguousPins = (
  getPatchByNodeId,
  listIntermediatePins
) =>
  R.mapObjIndexed((pinTypes, nodeId) =>
    foldMaybe(
      {},
      R.compose(
        R.omit(R.__, pinTypes),
        R.filter(
          R.pipe(R.propOr(Either.Left([]), R.__, pinTypes), Either.isLeft)
        ),
        R.map(Pin.getPinKey),
        listIntermediatePins
      ),
      getPatchByNodeId(nodeId)
    )
  );

// eslint-disable-next-line import/prefer-default-export
export const deducePinTypesWithoutBuses = def(
  'deducePinTypesWithoutBuses :: Patch -> Project -> DeducedPinTypes',
  (patch, project) => {
    // :: NodeId -> Maybe Patch
    const getPatchByNodeId = Project.getPatchByNodeId(R.__, patch, project);

    // :: [Node]
    const abstractNodes = R.compose(
      R.filter(
        R.compose(
          foldMaybe(false, R.pipe(Patch.listPins, R.any(Pin.isGenericPin))),
          getPatchByNodeId,
          Node.getNodeId
        )
      ),
      Patch.listNodes
    )(patch);

    // :: [NodeId]
    const abstractNodeIds = R.map(Node.getNodeId, abstractNodes);
    // :: [NodeId]
    const withoutDeferNodeIds = R.compose(
      R.map(Node.getNodeId),
      R.reject(R.compose(PPU.isDeferNodeType, Node.getNodeType))
    )(abstractNodes);

    // :: [[NodeId, NodeId]]
    const linksBetweenAbstractNodes = R.compose(
      R.map(Link.getLinkNodeIds),
      R.filter(
        R.both(
          // We use `setOf` and `inSet` cause it is faster than `isAmong` function.
          R.pipe(Link.getLinkInputNodeId, inSet(R.__, setOf(abstractNodeIds))),
          R.pipe(
            Link.getLinkOutputNodeId,
            inSet(R.__, setOf(withoutDeferNodeIds))
          )
        )
      ),
      Patch.listLinks
    )(patch);

    // :: [Node]
    const toposortedAbstractNodes = R.compose(
      catMaybies,
      R.map(Patch.getNodeById(R.__, patch)), // :: [Maybe Node]
      foldEither(R.always([]), R.identity), // :: [NodeId]
      R.map(Patch.sendDeferNodesToBottom(patch)),
      sortGraph // :: Either Error [NodeId]
    )(abstractNodeIds, linksBetweenAbstractNodes);

    // :: Map NodeId [Link]
    const linksByInputNodeId = R.compose(
      R.groupBy(Link.getLinkInputNodeId),
      Patch.listLinks
    )(patch);

    // :: Map NodeId (Map PinKey (Either [DataType] DataType))
    // Either [DataType] DataType is Right when type is resolved, and Left if there are conflicts.
    const stronglyResolvedTypes = R.compose(
      R.reject(R.isEmpty),
      R.reduce((previouslyDeducedPinTypes, abstractNode) => {
        const abstractNodeId = Node.getNodeId(abstractNode);
        const abstractNodeBoundValues = Node.getAllBoundValues(abstractNode);
        // :: Map PinKey DataValue
        const pinValuesForAbstractNode = R.compose(
          R.reject(R.isEmpty),
          foldMaybe(
            abstractNodeBoundValues,
            R.merge(R.__, abstractNodeBoundValues)
          ),
          R.map(
            R.compose(
              R.map(Pin.getPinDefaultValue),
              R.indexBy(Pin.getPinKey),
              Patch.listPins
            )
          ),
          Project.getPatchByNode
        )(abstractNode, project);
        const linksToNode = R.propOr([], abstractNodeId, linksByInputNodeId);

        // :: [(PinKey, DataType)]
        const pinTypesFromLinks = getPinTypesFromLinks(
          Link.getLinkOutputNodeId,
          Link.getLinkOutputPinKey,
          Link.getLinkInputPinKey,
          previouslyDeducedPinTypes,
          getPatchByNodeId,
          linksToNode,
          patch
        );

        const pinTypesFromBoundValues = R.compose(
          R.toPairs,
          R.map(Utils.getTypeFromLiteralUnsafe),
          R.filter(Utils.isValidLiteral)
        )(pinValuesForAbstractNode);

        const pinTypesFromLinksAndBoundValues = R.compose(
          // this will get rid of values bound to linked pins
          R.uniqBy(R.head),
          R.concat
        )(pinTypesFromLinks, pinTypesFromBoundValues);

        // :: Map PinKey (Either [DataType] DataType)
        const deducedPinTypesForNode = deducePinTypesForNode(
          abstractNode,
          getPatchByNodeId,
          previouslyDeducedPinTypes,
          pinTypesFromLinksAndBoundValues
        );

        return R.assoc(
          abstractNodeId,
          deducedPinTypesForNode,
          previouslyDeducedPinTypes
        );
      }, {})
    )(toposortedAbstractNodes);

    const linksByOutputNodeId = R.compose(
      R.groupBy(Link.getLinkOutputNodeId),
      Patch.listLinks
    )(patch);

    const weaklyResolvedTypes = R.compose(
      R.reject(R.isEmpty),
      R.reduceRight((abstractNode, previouslyDeducedPinTypes) => {
        const abstractNodeId = Node.getNodeId(abstractNode);
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
          linksFromNode,
          patch
        );

        // :: Map PinKey (Either [DataType] DataType)
        const deducedPinTypesForNode = deducePinTypesForNode(
          abstractNode,
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
    )(toposortedAbstractNodes);

    return R.useWith(R.mergeWith(R.merge), [
      omitIntermediateAmbiguousPins(getPatchByNodeId, Patch.listOutputPins),
      omitIntermediateAmbiguousPins(getPatchByNodeId, Patch.listInputPins),
    ])(stronglyResolvedTypes, weaklyResolvedTypes);
  }
);
