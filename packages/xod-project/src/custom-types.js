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
// Utility functions
// =============================================================================

const indexByTypename = R.indexBy(R.prop('typeName'));

// =============================================================================
// Derived constants
// =============================================================================

const CUSTOM_TYPES_LIST = R.values(BINDABLE_CUSTOM_TYPES_SPECS);

// :: StrMap DataType
export const BINDABLE_CUSTOM_TYPES = R.map(
  R.prop('typeName'),
  BINDABLE_CUSTOM_TYPES_SPECS
);

// :: Map DataType PatchPath
export const BINDABLE_CUSTOM_TYPE_CONSTRUCTORS = R.compose(
  R.pluck('nodeConstructor'),
  indexByTypename
)(CUSTOM_TYPES_LIST);

// :: Map DataType DataValue
export const BINDABLE_CUSTOM_TYPE_DEFAULT_VALUES = R.compose(
  R.pluck('defaultValue'),
  indexByTypename
)(CUSTOM_TYPES_LIST);

// :: [(String -> Boolean)]
export const BINDABLE_CUSTOM_TYPE_VALIDATORS = R.compose(
  R.pluck('validateLiteral'),
  indexByTypename
)(CUSTOM_TYPES_LIST);

// :: [DataType]
export const BINDABLE_CUSTOM_TYPES_LIST = R.pluck(
  'typeName',
  CUSTOM_TYPES_LIST
);

// :: Map DataType (Map DataType PatchPath)
export const BINDABLE_CUSTOM_TYPES_CAST_NODES = R.compose(
  R.pluck('casts'),
  R.indexBy(R.prop('typeName')),
  R.values
)(BINDABLE_CUSTOM_TYPES_SPECS);

// =============================================================================
// Functions
// =============================================================================

// :: String -> Boolean
export const isBindableCustomType = isAmong(
  R.pluck('typeName', CUSTOM_TYPES_LIST)
);
