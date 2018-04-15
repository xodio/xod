import * as R from 'ramda';
import { Maybe, Either } from 'ramda-fantasy';
import { foldEither, explodeEither, catMaybies, fail } from 'xod-func-tools';

import * as Link from './link';
import * as Node from './node';
import * as Patch from './patch';
import * as Project from './project';
import * as Pin from './pin';
import * as Utils from './utils';
import { def } from './types';
import flatten from './flatten';

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
  getPatchByNodeId, // :: NodeId -> Patch
  linksToNode,
  entryPatch
) =>
  R.compose(
    catMaybies,
    R.map(link => {
      const outwardNodeId = getOutwardNodeIdFromLink(link);
      const outwardNode = Patch.getNodeByIdUnsafe(outwardNodeId, entryPatch);
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
        Patch.getVariadicPinByKey(outwardNode, outwardPinKey),
        getPatchByNodeId
      )(outwardNodeId);
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
  const abstractPatch = getPatchByNodeId(abstractNodeId);
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
    R.compose(
      R.omit(R.__, pinTypes),
      R.filter(
        R.pipe(R.propOr(Either.Left([]), R.__, pinTypes), Either.isLeft)
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
        R.compose(
          R.any(Pin.isGenericPin),
          Patch.listPins,
          getPatchByNodeId,
          Node.getNodeId
        )
      ),
      catMaybies,
      R.map(Patch.getNodeById(R.__, patch)), // :: [Maybe Node]
      foldEither(R.always([]), R.identity), // :: [NodeId]
      Patch.getTopology // :: Either Error [NodeId]
    )(patch);

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

// :: DeducedTypes -> Either Error Map NodeId (Map PinKey Type)
const checkResolvedTypesForConflicts = R.ifElse(
  R.any(R.any(Either.isLeft)),
  () => fail('ALL_TYPES_MUST_BE_RESOLVED', {}),
  R.pipe(R.map(R.map(explodeEither)), Either.of)
);

// Pin -> (PinDirection, PinOrder)
const getPinPath = R.converge(R.pair, [
  Pin.getPinDirection,
  R.pipe(Pin.getPinOrder, R.toString),
]);

const getMapOfCorrespondingPinKeys = R.curry((patchFrom, patchTo) => {
  const pinKeysByPinPath = R.compose(
    R.map(R.map(Pin.getPinKey)),
    R.map(R.indexBy(Pin.getPinOrder)),
    R.groupBy(Pin.getPinDirection),
    Patch.listPins
  )(patchTo);

  return R.compose(
    R.map(R.pipe(getPinPath, R.path(R.__, pinKeysByPinPath))),
    R.indexBy(Pin.getPinKey),
    Patch.listPins
  )(patchFrom);
});

const inputPinKeyLens = R.lens(
  Link.getLinkInputPinKey,
  Link.setLinkInputPinKey
);
const outputPinKeyLens = R.lens(
  Link.getLinkOutputPinKey,
  Link.setLinkOutputPinKey
);

const relink = R.curry((patch, replacements) =>
  R.reduce(
    (resultingPatch, [nodeId, newType, mapOfCorrespondingPinKeys]) => {
      const getReplacementPinKey = oldPinKey =>
        mapOfCorrespondingPinKeys[oldPinKey] || oldPinKey;

      const updatedNode = R.compose(
        // TODO: what about bound values for static pins?
        Node.setNodeType(newType),
        Patch.getNodeByIdUnsafe(nodeId)
      )(resultingPatch);

      const updatedLinks = R.compose(
        R.map(
          R.cond([
            [
              Link.isLinkInputNodeIdEquals(nodeId),
              R.over(inputPinKeyLens, getReplacementPinKey),
            ],
            [
              Link.isLinkOutputNodeIdEquals(nodeId),
              R.over(outputPinKeyLens, getReplacementPinKey),
            ],
            [R.T, R.identity],
          ])
        ),
        Patch.listLinksByNode(nodeId)
      )(resultingPatch);

      return R.compose(
        explodeEither,
        Patch.upsertLinks(updatedLinks),
        Patch.assocNode(updatedNode)
      )(resultingPatch);
    },
    patch,
    replacements
  )
);

const getReplacementsForAbstractNodes = R.curry(
  (entryPatch, originalProject, deduced) =>
    R.compose(
      R.sequence(Either.of),
      R.map(([abstractNodeId, pinTypes]) => {
        const abstractPatch = Project.getPatchByNodeIdUnsafe(
          abstractNodeId,
          entryPatch,
          originalProject
        );

        // :: Map PinKey (PinDirection, PinOrder)
        const pinPathByKey = R.compose(
          R.map(getPinPath),
          R.indexBy(Pin.getPinKey),
          Patch.listPins
        )(abstractPatch);

        const patchSignatureMask = R.compose(
          R.reduce(
            (sig, [pinKey, type]) =>
              R.assocPath(
                // to avoid getting Map PinDirection Array
                pinPathByKey[pinKey].map(String),
                type,
                sig
              ),
            {}
          ),
          R.toPairs
        )(pinTypes);

        const matchingSpecializations = R.compose(
          R.filter(
            R.compose(
              Utils.matchPatchSignature(patchSignatureMask),
              Patch.getPatchSignature
            )
          ),
          Project.listAbstractPatchSpecializations(abstractPatch)
        )(originalProject);

        if (R.isEmpty(matchingSpecializations)) {
          return fail('CANT_FIND_SPECIALIZATIONS_FOR_ABSTRACT_PATCH', {
            patchPath: Patch.getPatchPath(abstractPatch),
          });
        }

        if (matchingSpecializations.length > 1) {
          return fail('CONFLICTING_SPECIALIZATIONS_FOR_ABSTRACT_PATCH', {
            patchPath: Patch.getPatchPath(abstractPatch),
            conflictingSpecializations: R.map(
              Patch.getPatchPath,
              matchingSpecializations
            ),
          });
        }

        const specialization = R.head(matchingSpecializations);

        return Either.of([
          abstractNodeId,
          Patch.getPatchPath(specialization),
          getMapOfCorrespondingPinKeys(abstractPatch, specialization),
        ]);
      }),
      R.toPairs
    )(deduced)
);

export const autoresolveTypes = R.curry((entryPatchPath, project) =>
  R.compose(
    R.chain(flatProject => {
      const entryPatch = Project.getPatchByPathUnsafe(
        entryPatchPath,
        flatProject
      );

      return R.compose(
        R.chain(Project.assocPatch(entryPatchPath, R.__, project)),
        // :: Either Error Patch
        R.map(relink(entryPatch)),
        // :: Either Error [(NodeId, PatchPath, Map PinKey Pinkey)]
        R.chain(getReplacementsForAbstractNodes(entryPatch, project)),
        checkResolvedTypesForConflicts,
        deducePinTypes
      )(entryPatch, flatProject);
    }),
    flatten
  )(project, entryPatchPath)
);
