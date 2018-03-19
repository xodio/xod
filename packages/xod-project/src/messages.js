// Variadics

export const noVariadicMarkers = patchPath =>
  `Patch "${patchPath}" has no variadic markers.`;

export const tooManyVariadicMarkers = patchPath =>
  `Patch "${patchPath}" has more than one variadic-* marker`;

export const notEnoughVariadicInputs = (arityStep, outputCount, minInputs) =>
  `A variadic-${arityStep} patch node with ${outputCount} outputs should have at least ${minInputs} inputs`;

export const wrongVariadicPinTypes = (inputPinLabels, outputPinLabels) =>
  `Types of inputs ${inputPinLabels.join(
    ', '
  )} should match the types of outputs ${outputPinLabels.join(', ')}`;

export const ERR_VARIADIC_HAS_NO_OUTPUTS =
  'A variadic patch should have at least one output';

// Abstract patches

export const nonsequentialGenericTerminals = expectedPinTypes =>
  `Generic inputs should be employed sequentially. Use ${expectedPinTypes.join(
    ', '
  )}`;
