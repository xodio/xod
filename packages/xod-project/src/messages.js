export const formatDeadReferencesFound = (patchPath, submessage) => [
  `Patch ${patchPath} contains dead references:`,
  submessage,
  'Fix or delete them to continue.',
].join('\n');

// Variadics

export const patchHasNoVariadicMarkers = patchPath => `Patch "${patchPath}" has no variadic markers.`;

export const patchHasMoreThanOneVariadicMarkers = patchPath => `Patch "${patchPath}" has more than one variadic-* marker`;

export const variadicHasNotEnoughInputs = (arityStep, outputCount, minInputs) =>
  `A variadic-${arityStep} patch node with ${outputCount} outputs should have at least ${minInputs} inputs`;

export const ERR_VARIADIC_HAS_NO_OUTPUTS = 'A variadic patch should have at least one output';
