import * as R from 'ramda';
import { isAmong } from 'xod-func-tools';

import PIN_TYPE from './internal/pinTypes';

// =============================================================================
//
// Add custom type specifications in BINDABLE_CUSTOM_TYPES_SPECS
// Key — an alias for easy access by a Developer
// Value — specification object
//
// =============================================================================

export const BINDABLE_CUSTOM_TYPES_SPECS = {
  COLOR: {
    typeName: 'xod/color/color',
    nodeConstructor: 'xod/color/color',
    defaultValue: '#000000',
    validateLiteral: R.test(/^#[0-9A-F]{6}$/),
    casts: {
      [PIN_TYPE.STRING]: 'xod/color/format-color',
    },
  },
};

// =============================================================================

export const BINDABLE_CUSTOM_TYPES = R.map(
  R.prop('typeName'),
  BINDABLE_CUSTOM_TYPES_SPECS
);

const typesList = R.values(BINDABLE_CUSTOM_TYPES_SPECS);

const indexByTypename = R.indexBy(R.prop('typeName'));

// :: String -> Boolean
export const isBindableCustomType = isAmong(R.pluck('typeName', typesList));

// :: () -> Map TypeName PatchPath
export const getCustomTypeConstructorsMap = () =>
  R.compose(R.pluck('nodeConstructor'), indexByTypename)(typesList);

// :: () -> Map TypeName DataValue
export const getCustomTypeDefaultValuesMap = () =>
  R.compose(R.pluck('defaultValue'), indexByTypename)(typesList);

// :: () -> [(String -> Boolean)]
export const listCustomTypeLiteralValidators = () =>
  R.pluck('validateLiteral', typesList);

// :: () -> [TypeName]
export const listCustomTypeNames = () => R.pluck('typeName', typesList);

export const getCustomTypesCompatibility = () =>
  R.compose(R.pluck('casts'), R.indexBy(R.prop('typeName')), R.values)(
    BINDABLE_CUSTOM_TYPES_SPECS
  );
