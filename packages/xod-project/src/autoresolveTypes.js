import * as R from 'ramda';
import { Either } from 'ramda-fantasy';
import {
  foldEither,
  foldMaybe,
  reduceEither,
  explodeEither,
  fail,
  failOnNothing,
  prependTraceToError,
} from 'xod-func-tools';

import * as Node from './node';
import * as Patch from './patch';
import * as Project from './project';
import * as Pin from './pin';
import * as Utils from './utils';
import * as PPU from './patchPathUtils';
import { def } from './types';
import { deducePinTypes } from './TypeDeduction_Js.bs';

//
// Autoresolving abstract nodes
//

// returns [ (DataType, DataType) ]
// something like [ [t1, string], [t2, number] ]
const getDeducedTypesForGenericPins = (project, genericNode, deducedTypes) => {
  const genericNodeId = Node.getNodeId(genericNode);
  const genericNodeType = Node.getNodeType(genericNode);
  const genericPatch = Project.getPatchByPathUnsafe(genericNodeType, project);

  const eitherPinTypes = R.propOr({}, genericNodeId, deducedTypes);

  if (R.isEmpty(eitherPinTypes)) {
    return fail('NO_DEDUCED_TYPES_FOUND_FOR_GENERIC_NODE', {
      genericNodeId,
      genericNodeType,
      trace: [genericNodeType],
    });
  }

  const conflictingPin = R.compose(
    R.find(R.pipe(R.nth(1), Either.isLeft)),
    R.toPairs
  )(eitherPinTypes);

  if (conflictingPin) {
    const [conflictingPinKey, eitherConflictingTypes] = conflictingPin;
    const genericPinType = R.compose(
      Pin.getPinType,
      // if types were deduced for it, it certainly exists
      Patch.getPinByKeyUnsafe(conflictingPinKey)
    )(genericPatch);

    return fail('CONFLICTING_TYPES_FOR_NODE', {
      conflictingTypes: foldEither(
        R.identity,
        R.identity,
        eitherConflictingTypes
      ),
      genericPinType,
      trace: [genericNodeType],
    });
  }

  const pinTypes = R.map(explodeEither, eitherPinTypes);
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
      R.map(PPU.normalizeTypeNameForAbstractsResolution),
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
        R.map(PPU.normalizeTypeNameForAbstractsResolution),
        R.map(R.nth(1))
      )(deducedTypesForGenericPins);

      return R.compose(
        R.map(R.pair(specializationPatchPath)), // :: Either Error (PatchPath, Project)
        autoresolveTypes(specializationPatchPath), // :: Either Error Project
        Project.assocPatch(
          specializationPatchPath,
          specializeTerminals(deducedTypesForGenericPins, genericPatch)
        )
      )(project);
    }

    const specializationPatchPath = R.compose(Patch.getPatchPath, R.head)(
      matchingSpecializations
    );
    return R.compose(
      R.map(R.pair(specializationPatchPath)),
      // in case specialization itself uses generic nodes
      autoresolveTypes(specializationPatchPath)
    )(project);
  }
);

const autoresolveTypes = def(
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

export default autoresolveTypes;
