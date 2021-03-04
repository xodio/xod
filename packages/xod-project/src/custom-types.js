import * as R from 'ramda';
import { isAmong } from 'xod-func-tools';

import PIN_TYPE from './internal/pinTypes';

// =============================================================================
//
// Add custom type specifications in CUSTOM_TYPES_SPECS
// Key — an alias for easy access by a Developer
// Value — specification object
//
// =============================================================================

export const CUSTOM_TYPES_SPECS = {
  COLOR: {
    typeName: 'xod/color/color',
    nodeConstructor: 'xod/color/color',
    casts: {
      [PIN_TYPE.STRING]: 'xod/color/format-color',
    },
    ...{
      isBindable: true,
      // required fields:
      defaultValue: '#000000',
      validateLiteral: R.test(/^#[0-9A-F]{6}$/),
    },
  },
  MICROS: {
    typeName: 'xod/core/micros',
    nodeConstructor: 'xod/core/micros',
    casts: {
      [PIN_TYPE.STRING]: 'xod/core/cast-to-string(micros)',
    },
    isBindable: false,
  },
};

// =============================================================================
// Utility functions
// =============================================================================

const indexByTypename = R.indexBy(R.prop('typeName'));

const filterBindable = R.filter(R.prop('isBindable'));

// =============================================================================
// Derived constants
// =============================================================================

const CUSTOM_TYPES_LIST = R.values(CUSTOM_TYPES_SPECS);

// :: Map DataType PatchPath
export const CUSTOM_TYPE_CONSTRUCTORS = R.compose(
  R.pluck('nodeConstructor'),
  indexByTypename
)(CUSTOM_TYPES_LIST);

// :: Map DataType (Map DataType PatchPath)
export const CUSTOM_TYPES_CAST_NODES = R.compose(
  R.pluck('casts'),
  indexByTypename
)(CUSTOM_TYPES_LIST);

// :: StrMap DataType
export const BINDABLE_CUSTOM_TYPES = R.compose(
  R.pluck('typeName'),
  filterBindable
)(CUSTOM_TYPES_SPECS);

// :: Map DataType DataValue
export const BINDABLE_CUSTOM_TYPE_DEFAULT_VALUES = R.compose(
  R.pluck('defaultValue'),
  indexByTypename,
  filterBindable
)(CUSTOM_TYPES_LIST);

// :: Map DataType (String -> Boolean)
export const BINDABLE_CUSTOM_TYPE_VALIDATORS = R.compose(
  R.pluck('validateLiteral'),
  indexByTypename,
  filterBindable
)(CUSTOM_TYPES_LIST);

// :: [DataType]
export const BINDABLE_CUSTOM_TYPES_LIST = R.compose(
  R.pluck('typeName'),
  filterBindable
)(CUSTOM_TYPES_LIST);

// =============================================================================
// Functions
// =============================================================================

// :: String -> Boolean
export const isBindableCustomType = isAmong(R.values(BINDABLE_CUSTOM_TYPES));
