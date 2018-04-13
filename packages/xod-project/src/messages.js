// Stanza creators.
// See `xod-func-tools` package Stanza type
export default {
  // Patch
  INVALID_PATCH_PATH: ({ patchPath }) => ({
    title: 'Invalid patch path',
    note: `Path "${patchPath}" is empty or contains invalid characters`,
  }),
  PATCH_NOT_FOUND_BY_PATH: ({ patchPath }) => ({
    title: 'Patch not found',
    note: `Can't find the patch in the project with specified path: "${patchPath}"`,
  }),
  CANT_UPDATE_PATCH__PATCH_NOT_FOUND_BY_PATH: ({ patchPath }) => ({
    title: "Can't update patch",
    note: `Can't find the patch in the project with specified path: "${patchPath}"`,
  }),

  // Generics, Abstracts and etc
  ALL_TYPES_MUST_BE_RESOLVED: ({ patchPath, currentPatchPath, path }) => ({
    title: 'Project contains unresolved abstract patches',
    note: `Patch "${currentPatchPath}" contains an Abstract Node "${patchPath}" that can't be resolved`,
    path,
  }),
  GENERIC_TERMINALS_REQUIRED: ({ path }) => ({
    title: 'Invalid abstract patch',
    note: 'At least one generic terminal is required',
    path,
  }),
  ORPHAN_GENERIC_OUTPUTS: ({ path, types }) => ({
    title: 'Invalid abstract patch',
    note: `For each generic output there has to be at least one generic input of the same type. Create ${types
      .map(x => `input-${x}`)
      .join(', ')}`,
    path,
  }),
  NONSEQUENTIAL_GENERIC_TERMINALS: ({ path, types }) => ({
    title: 'Invalid abstract patch',
    note: `Generic inputs should be employed sequentially. Use ${types.join(
      ', '
    )}`,
    path,
  }),

  // Variadics
  NO_VARIADIC_MARKERS: ({ path }) => ({
    title: "Can't compute variadic pins",
    note: `Patch has no variadic markers.`,
    path,
  }),
  TOO_MANY_VARIADIC_MARKERS: ({ path }) => ({
    title: 'Invalid variadic patch',
    note: `Patch has more than one variadic-* marker`,
    path,
  }),
  NOT_ENOUGH_VARIADIC_INPUTS: ({
    path,
    arityStep,
    outputCount,
    minInputs,
  }) => ({
    title: 'Invalid variadic patch',
    note: `A variadic-${arityStep} patch with ${outputCount} outputs should have at least ${minInputs} inputs`,
    path,
  }),
  WRONG_VARIADIC_PIN_TYPES: ({ inputPinLabels, outputPinLabels, path }) => ({
    title: 'Invalid variadic patch',
    note: `Types of inputs ${inputPinLabels.join(
      ', '
    )} should match the types of outputs ${outputPinLabels.join(', ')}`,
    path,
  }),
  VARIADIC_HAS_NO_OUTPUTS: ({ path }) => ({
    title: 'Invalid variadic patch',
    note: `A variadic patch should have at least one output`,
    path,
  }),

  // Transpile
  IMPLEMENTATION_NOT_FOUND: ({ patchPath, path }) => ({
    title: 'No implementation found in leaf patch',
    note: `No implementation for ${patchPath} found.`,
    path,
  }),
  CPP_AS_ENTRY_POINT: ({ patchPath }) => ({
    title: "Can't transpile selected Patch",
    note: `Can’t use patch "${patchPath}" as entry point, cause it is not implemented in XOD`,
  }),
  ABSTRACT_AS_ENTRY_POINT: ({ patchPath }) => ({
    title: "Can't transpile selected Patch",
    note: `Can’t use abstract patch "${patchPath}" as entry point`,
  }),
  CAST_PATCH_NOT_FOUND: ({ patchPath }) => ({
    title: 'Cast patch not found',
    note: `Casting patch "${patchPath}" is not found in the project`,
  }),
  ENTRY_POINT_PATCH_NOT_FOUND_BY_PATH: ({ patchPath }) => ({
    title: 'Entry point patch not found',
    note: `Entry point patch not found by path "${patchPath}"`,
  }),

  // Project validation
  LINK_INPUT_NODE_NOT_FOUND: ({ path }) => ({
    title: 'Invalid link',
    note: 'Input node of the link does not exist in this patch',
    path,
  }),
  LINK_OUTPUT_NODE_NOT_FOUND: ({ path }) => ({
    title: 'Invalid link',
    note: 'Output node of the link does not exist in this patch',
    path,
  }),
  INCOMPATIBLE_PINS__CANT_CAST_TYPES_DIRECTLY: ({
    fromType,
    toType,
    path,
  }) => ({
    title: 'Program contains bad links',
    note: `Type ${fromType} can’t cast to ${toType} directly.`,
    solution:
      'Replace bad links with a nodes, that are represent a logic how you want to cast these types',
    path,
  }),
  INCOMPATIBLE_PINS__LINK_CAUSES_TYPE_CONFLICT: ({ types, path }) => ({
    title: 'Program contains bad links',
    note: `Link causes type conflict between ${types.join(', ')}`,
    path,
    // TODO: Add a solution
  }),
  DEAD_REFERENCE__PINS_NOT_FOUND: ({ pinKey, patchPath, path }) => ({
    title: 'Dead reference error',
    note: `Can't find the Pin "${pinKey}" in the patch with path "${patchPath}"`,
    path,
  }),
  DEAD_REFERENCE__PATCH_FOR_NODE_NOT_FOUND: ({ nodeType, path }) => ({
    title: 'Dead reference error',
    note: `Patch "${nodeType}" is not found in the project`,
    path,
  }),
  DEAD_REFERENCE__NODE_NOT_FOUND: ({ nodeId, patchPath, path }) => ({
    title: 'Dead reference error',
    note: `Can't find the Node "${nodeId}" in the patch with path "${patchPath}"`,
    path,
  }),
  LOOPS_DETECTED: () => ({
    title: 'Loops detected',
    note: 'The program has a cycle path',
    solution: 'Use xod/core/defer node to break the cycle',
  }),

  // Patch rebasing
  CANT_REBASE_PATCH__OCCUPIED_PATH: ({ newPath }) => ({
    title: `Can't rebase patch`,
    note: `Another patch with path "${newPath}" already exists.`,
    solution: 'Rename or delete existing patch before',
  }),
  CANT_REBASE_PATCH__BUILT_IN_PATCH: ({ oldPath }) => ({
    title: "Can't rebase patch",
    note: `Can't rebase built-in patch "${oldPath}"`,
  }),
  CANT_REBASE_PATCH__PATCH_NOT_FOUND_BY_PATH: ({ oldPath }) => ({
    title: `Can't rebase patch`,
    note: `Can't find the patch in the project with specified path: "${oldPath}"`,
  }),

  // Load project
  INVALID_XODBALL_FORMAT: () => ({
    title: 'Invalid xodball format',
    note: 'File that you try to load is corrupted and has a wrong structure',
  }),
  NOT_A_JSON: () => ({
    title: 'Not a JSON format',
    note: 'File that you try to load is not in a JSON format',
  }),
};
