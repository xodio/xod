import { enumerate } from 'xod-func-tools';

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
  ALL_TYPES_MUST_BE_RESOLVED: ({ patchPath, currentPatchPath, trace }) => ({
    title: 'Project contains unresolved abstract patches',
    note: `Patch "${currentPatchPath}" contains an Abstract Node "${patchPath}" that can't be resolved`,
    trace,
  }),
  GENERIC_TERMINALS_REQUIRED: ({ trace }) => ({
    title: 'Invalid abstract patch',
    note: 'At least one generic terminal is required',
    trace,
  }),
  ORPHAN_GENERIC_OUTPUTS: ({ trace, types }) => ({
    title: 'Invalid abstract patch',
    note: `For each generic output there has to be at least one generic input of the same type. Create ${types
      .map(x => `input-${x}`)
      .join(', ')}`,
    trace,
  }),
  NONSEQUENTIAL_GENERIC_TERMINALS: ({ trace, types }) => ({
    title: 'Invalid abstract patch',
    note: `Generic inputs should be employed sequentially. Use ${types.join(
      ', '
    )}`,
    trace,
  }),
  CANT_FIND_SPECIALIZATIONS_FOR_ABSTRACT_PATCH: ({
    patchPath,
    expectedSpecializationName,
    trace,
  }) => ({
    title: 'Specialization patch not found',
    note: `Cannot find specialization ${expectedSpecializationName} for abstract ${patchPath}.`,
    solution:
      'Try creating the missing patch in your project or install a library which provides such one.',
    trace,
  }),
  CONFLICTING_SPECIALIZATIONS_FOR_ABSTRACT_PATCH: ({
    patchPath,
    conflictingSpecializations,
    trace,
  }) => ({
    title: `Conflicting specializations for abstrat patch ${patchPath}`,
    note: `To continue, explicitly switch to ${enumerate(
      ', ',
      ' or ',
      conflictingSpecializations
    )}`,
    trace,
  }),
  SPECIALIZATION_PATCH_CANT_BE_ABSTRACT: ({ trace }) => ({
    title: 'This error should not be visible to end user yet',
    trace,
  }),
  SPECIALIZATION_PATCH_MUST_HAVE_SAME_ARITY_LEVEL: ({ trace }) => ({
    title: 'This error should not be visible to end user yet',
    trace,
  }),
  SPECIALIZATION_PATCH_CANT_HAVE_GENERIC_PINS: ({ trace }) => ({
    title: 'This error should not be visible to end user yet',
    trace,
  }),
  SPECIALIZATION_PATCH_MUST_HAVE_N_INPUTS: ({ trace }) => ({
    title: 'This error should not be visible to end user yet',
    trace,
  }),
  SPECIALIZATION_PATCH_MUST_HAVE_N_OUTPUTS: ({ trace }) => ({
    title: 'This error should not be visible to end user yet',
    trace,
  }),
  SPECIALIZATION_STATIC_PINS_DO_NOT_MATCH: ({ trace }) => ({
    title: 'This error should not be visible to end user yet',
    trace,
  }),
  SPECIALIZATION_HAS_CONFLICTING_TYPES_FOR_GENERIC: ({ trace }) => ({
    title: 'This error should not be visible to end user yet',
    trace,
  }),
  SPECIALIZATION_HAS_WRONG_NAME: ({ trace }) => ({
    title: 'This error should not be visible to end user yet',
    trace,
  }),
  NO_DEDUCED_TYPES_FOUND_FOR_GENERIC_NODE: ({ trace }) => ({
    title: "Can't deduce types for patch",
    solution: 'Connect links or bind values to generic inputs',
    trace,
  }),
  CONFLICTING_TYPES_FOR_NODE: ({
    trace,
    genericPinType,
    conflictingTypes,
  }) => ({
    title: 'Generic types don’t match',
    note: `Types ${enumerate(
      ', ',
      ' and ',
      conflictingTypes
    )} conflict; ${genericPinType} can’t be resolved unambiguously.`,
    solution:
      'Either add nodes to a single type, or switch to a particular node specialization.',
    trace,
  }),
  UNRESOLVED_GENERIC_PIN: ({ trace, unresolvedPinType }) => ({
    title: "Can't resolve type for pin",
    note: `Pin with type ${unresolvedPinType} can't be resolved`,
    solution: `Connect a link or bind a value to it`,
    trace,
  }),
  UNRESOLVED_ABSTRACT_NODES_LEFT: ({ unresolvedNodeTypes }) => ({
    title: 'Project contains unresolved abstract nodes',
    note: `Make sure node${
      unresolvedNodeTypes.lenght === 1 ? '' : 's'
    } ${enumerate(', ', ' and ', unresolvedNodeTypes)} ${
      unresolvedNodeTypes.lenght === 1 ? 'is' : 'are'
    } linked`,
  }),

  // Constructor patches
  CONSTRUCTOR_PATCH_CANT_HAVE_GENERIC_PINS: ({ trace }) => ({
    title: 'Invalid constructor patch',
    note: "Constructor patches can't have generic pins",
    trace,
  }),
  CONSTRUCTOR_PATCH_MUST_BE_NIIX: ({ trace }) => ({
    title: 'Invalid constructor patch',
    note: 'Constructor patches must be implemented in C++',
    solution: 'Add a not-implemented-in-xod node and provide an implementation',
    trace,
  }),

  // Variadics
  NO_VARIADIC_MARKERS: ({ trace }) => ({
    title: "Can't compute variadic pins",
    note: `Patch has no variadic markers.`,
    trace,
  }),
  TOO_MANY_VARIADIC_MARKERS: ({ trace }) => ({
    title: 'Invalid variadic patch',
    note: `Patch has more than one variadic-* marker`,
    trace,
  }),
  NOT_ENOUGH_VARIADIC_INPUTS: ({
    trace,
    arityStep,
    outputCount,
    minInputs,
  }) => ({
    title: 'Invalid variadic patch',
    note: `A variadic-${arityStep} patch with ${outputCount} outputs should have at least ${minInputs} inputs`,
    trace,
  }),
  WRONG_VARIADIC_PIN_TYPES: ({ accPinLabels, outPinLabels, trace }) => ({
    title: 'Invalid variadic patch',
    note: `Types of inputs ${accPinLabels.join(
      ', '
    )} should match the types of outputs ${outPinLabels.join(', ')}`,
    trace,
  }),
  VARIADIC_HAS_NO_OUTPUTS: ({ trace }) => ({
    title: 'Invalid variadic patch',
    note: `A variadic patch should have at least one output`,
    trace,
  }),

  // Transpile
  IMPLEMENTATION_NOT_FOUND: ({ patchPath, trace }) => ({
    title: 'No implementation found in leaf patch',
    note: `No implementation for ${patchPath} found.`,
    trace,
  }),
  CPP_AS_ENTRY_POINT: ({ patchPath }) => ({
    title: "Can't transpile selected Patch",
    note: `Can’t use patch "${patchPath}" as entry point, cause it is not implemented in XOD`,
  }),
  ABSTRACT_AS_ENTRY_POINT: ({ patchPath }) => ({
    title: "Can't transpile selected Patch",
    note: `Can’t use abstract patch "${patchPath}" as entry point`,
  }),
  ENTRY_POINT_PATCH_NOT_FOUND_BY_PATH: ({ patchPath }) => ({
    title: 'Entry point patch not found',
    note: `Entry point patch not found by path "${patchPath}"`,
  }),

  // Project validation
  LINK_INPUT_NODE_NOT_FOUND: ({ trace }) => ({
    title: 'Invalid link',
    note: 'Input node of the link does not exist in this patch',
    trace,
  }),
  LINK_OUTPUT_NODE_NOT_FOUND: ({ trace }) => ({
    title: 'Invalid link',
    note: 'Output node of the link does not exist in this patch',
    trace,
  }),
  INCOMPATIBLE_PINS__CANT_CAST_TYPES_DIRECTLY: ({
    fromType,
    toType,
    trace,
  }) => ({
    title: 'Program contains bad links',
    note: `Type ${fromType} can’t cast to ${toType} directly.`,
    solution: `Replace bad links with nodes that explicitly convert ${fromType} to ${toType}`,
    trace,
  }),
  INCOMPATIBLE_PINS__LINK_CAUSES_TYPE_CONFLICT: ({ types, trace }) => ({
    title: 'Program contains bad links',
    note: `Link causes type conflict between ${enumerate(
      ', ',
      ' and ',
      types
    )}`,
    trace,
    // TODO: Add a solution
  }),
  DEAD_REFERENCE__PINS_NOT_FOUND: ({ pinKey, patchPath, trace }) => ({
    title: 'Dead reference error',
    note: `Can't find the Pin "${pinKey}" in the patch with path "${patchPath}"`,
    trace,
  }),
  CLASHING_PIN_LABELS: ({ label, pinKeys, trace }) => ({
    title: 'Clashing pin names',
    note: `${pinKeys.length} pins are named ${label}`,
    solution: 'Give the pins unique names',
    trace,
  }),
  DEAD_REFERENCE__PATCH_FOR_NODE_NOT_FOUND: ({ nodeType, trace }) => ({
    title: 'Dead reference error',
    note: `Patch "${nodeType}" is not found in the project`,
    trace,
  }),
  DEAD_REFERENCE__NODE_NOT_FOUND: ({ nodeId, patchPath, trace }) => ({
    title: 'Dead reference error',
    note: `Can't find the Node "${nodeId}" in the patch with path "${patchPath}"`,
    trace,
  }),
  INVALID_LITERAL_BOUND_TO_PIN: ({ pinName, literal, trace }) => ({
    title: 'Bad literal value',
    note: `Value ${literal} bound to ${pinName} is invalid.`,
    solution: `If you meant a string, surround it with double quotes: "${literal}".`,
    trace,
  }),
  LOOPS_DETECTED: () => ({
    title: 'Loops detected',
    note: 'The program has a cycle',
    solution: 'Use xod/core/defer node to break the cycle',
  }),
  BAD_LITERAL_VALUE: ({ value }) => ({
    title: 'Bad literal value',
    note: `${value} is not a valid literal`,
    solution: `If you meant a string, surround it with double quotes: "${value}".`,
  }),

  ORPHAN_FROM_BUS_NODES: ({ label, trace }) => ({
    title: 'No bus source',
    trace,
    note: `Bus '${label}' does not exist`,
    solution: `Create a 'to-bus' node with label '${label}' to define the required bus.`,
  }),
  CONFLICTING_TO_BUS_NODES: ({ label, trace }) => ({
    title: 'Multiple bus sources',
    trace,
    note: `Bus '${label}' has multiple conflicting sources`,
    solution: `Delete or rename one of 'to-bus' nodes so that the bus gets a single source of data.`,
  }),
  FLOATING_TO_BUS_NODES: ({ label, trace }) => ({
    title: 'Bus floats',
    trace,
    note: `Bus '${label}' source is not linked anywhere`,
    solution: `Link the 'to-bus' node with label '${label}' to an output pin of another node.`,
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
