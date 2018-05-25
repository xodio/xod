import * as R from 'ramda';
import { Maybe, Either } from 'ramda-fantasy';
import {
  foldEither,
  foldMaybe,
  reduceEither,
  explodeEither,
  explodeMaybe,
  catMaybies,
  fail,
  failOnNothing,
  prependTraceToError,
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

export const deducePinTypes = def(
  'deducePinTypes :: Patch -> Project -> DeducedPinTypes',
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

//
// Autoresolving abstract nodes
//

// returns [ (DataType, DataType) ]
// something like [ [t1, string], [t2, number] ]
const getDeducedTypesForGenericPins = (project, genericNode, deducedTypes) => {
  const genericNodeId = Node.getNodeId(genericNode);
  const genericNodeType = Node.getNodeType(genericNode);

  const eitherPinTypes = R.propOr({}, genericNodeId, deducedTypes);

  if (R.isEmpty(eitherPinTypes)) {
    return fail('NO_DEDUCED_TYPES_FOUND_FOR_GENERIC_NODE', {
      genericNodeId,
      genericNodeType,
      trace: [genericNodeType],
    });
  }

  const conflictingTypes = R.compose(
    R.find(Either.isLeft),
    R.values // TODO: do we need pinKeys in error?
  )(eitherPinTypes);

  if (conflictingTypes) {
    return fail('CONFLICTING_TYPES_FOR_NODE', {
      genericNodeId,
      genericNodeType,
      trace: [genericNodeType],
    });
  }

  const pinTypes = R.map(explodeEither, eitherPinTypes);
  const genericPatch = Project.getPatchByPathUnsafe(genericNodeType, project);
  const deducedTypesForGenerics = R.compose(
    R.sortBy(R.head),
    R.uniqBy(R.head),
    R.map(pin => [Pin.getPinType(pin), pinTypes[Pin.getPinKey(pin)]]),
    R.filter(Pin.isGenericPin),
    Patch.listPins
  )(genericPatch);

  const unresolvedGeneric = R.find(R.pipe(R.nth(1), R.isNil))(
    deducedTypesForGenerics
  );

  if (unresolvedGeneric) {
    return fail('UNRESOLVED_GENERIC_PIN', {
      genericNodeId,
      genericNodeType,
      trace: [genericNodeType],
      unresolvedPinType: R.head(unresolvedGeneric),
    });
  }

  return Either.of(deducedTypesForGenerics);
};

const specializeTerminals = (deducedTypesForGenericPins, genericPatch) => {
  const dataTypesForGenerics = R.fromPairs(deducedTypesForGenericPins);

  const specializedTerminals = R.compose(
    R.map(
      R.over(
        R.lens(
          R.pipe(Node.getNodeType, PPU.getTerminalDataType),
          (newDataType, node) => {
            const direction = R.compose(
              PPU.getTerminalDirection,
              Node.getNodeType
            )(node);

            return Node.setNodeType(
              PPU.getTerminalPath(direction, newDataType),
              node
            );
          }
        ),
        R.prop(R.__, dataTypesForGenerics)
      )
    ),
    R.filter(
      R.both(
        Node.isPinNode,
        R.pipe(Node.getNodeType, PPU.getTerminalDataType, Utils.isGenericType)
      )
    ),
    Patch.listNodes
  )(genericPatch);

  return Patch.upsertNodes(specializedTerminals, genericPatch);
};

const findOrCreateSpecialization = R.curry(
  (autoresolveTypes, project, genericNode, deducedTypesForGenericPins) => {
    const genericNodeType = Node.getNodeType(genericNode);
    const genericPatch = Project.getPatchByPathUnsafe(genericNodeType, project);

    const expectedSpecializationName = R.compose(
      PPU.getSpecializationPatchPath(PPU.getBaseName(genericNodeType)),
      R.map(R.nth(1))
    )(deducedTypesForGenericPins);

    const matchingSpecializations = R.compose(
      R.filter(
        R.compose(
          R.equals(expectedSpecializationName),
          PPU.getBaseName,
          Patch.getPatchPath
        )
      ),
      Project.listAbstractPatchSpecializations(genericPatch)
    )(project);

    if (matchingSpecializations.length > 1) {
      return fail('CONFLICTING_SPECIALIZATIONS_FOR_ABSTRACT_PATCH', {
        patchPath: Patch.getPatchPath(genericPatch),
        conflictingSpecializations: R.map(
          Patch.getPatchPath,
          matchingSpecializations
        ),
      });
    }

    if (R.isEmpty(matchingSpecializations)) {
      if (Patch.isAbstractPatch(genericPatch)) {
        return fail('CANT_FIND_SPECIALIZATIONS_FOR_ABSTRACT_PATCH', {
          patchPath: Patch.getPatchPath(genericPatch),
          expectedSpecializationName,
        });
      }

      // we have a patch composed form other generic patches.
      // let's try to create a specialization
      const specializationPatchPath = R.compose(
        PPU.getSpecializationPatchPath(genericNodeType),
        R.map(R.nth(1))
      )(deducedTypesForGenericPins);

      return R.compose(
        R.map(R.pair(specializationPatchPath)), // :: Either Error (PatchPath, Project)
        autoresolveTypes(specializationPatchPath), // :: Either Error Project
        Project.assocPatchUnsafe(
          specializationPatchPath,
          specializeTerminals(deducedTypesForGenericPins, genericPatch)
        )
      )(project);
    }

    const specialization = R.head(matchingSpecializations);
    return Either.of([Patch.getPatchPath(specialization), project]);
  }
);

export const autoresolveTypes = def(
  'autoresolveTypes :: PatchPath -> Project -> Either Error Project',
  (entryPatchPath, project) =>
    R.compose(
      prependTraceToError(entryPatchPath),
      R.chain(entryPatch =>
        R.compose(
          deducedTypes =>
            reduceEither(
              (updatedProject, node) => {
                const nodeType = Node.getNodeType(node);

                const hasGenericPins = R.compose(
                  foldMaybe(
                    false,
                    R.pipe(Patch.listPins, R.any(Pin.isGenericPin))
                  ),
                  Project.getPatchByPath
                )(nodeType, updatedProject);

                if (!hasGenericPins) {
                  return autoresolveTypes(nodeType, updatedProject);
                }

                return R.compose(
                  R.map(
                    ([specializationPatchPath, projectWithSpecialization]) =>
                      Project.changeNodeTypeUnsafe(
                        entryPatchPath,
                        Node.getNodeId(node),
                        specializationPatchPath,
                        projectWithSpecialization
                      )
                  ),
                  R.chain(
                    findOrCreateSpecialization(
                      autoresolveTypes,
                      updatedProject,
                      node
                    )
                  ),
                  getDeducedTypesForGenericPins
                )(updatedProject, node, deducedTypes);
              },
              project,
              Patch.listNodes(entryPatch)
            ),
          deducePinTypes
        )(entryPatch, project)
      ),
      failOnNothing('ENTRY_POINT_PATCH_NOT_FOUND_BY_PATH', {
        patchPath: entryPatchPath,
      }),
      Project.getPatchByPath(entryPatchPath)
    )(project)
);
