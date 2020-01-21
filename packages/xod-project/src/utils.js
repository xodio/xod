import * as R from 'ramda';
import shortid from 'shortid';

import { Either } from 'ramda-fantasy';
import { isAmong, fail, explodeEither, notNil } from 'xod-func-tools';

import {
  listCustomTypeLiteralValidators,
  listCustomTypeNames,
} from './custom-types';
import * as CONST from './constants';
import { def } from './types';

/**
 * Contains resulting value or error
 *
 * See: {@link https://github.com/ramda/ramda-fantasy/blob/master/docs/Either.md}
 *
 * @external Either
 */

/**
 * Contains resulting value or null
 *
 * See: {@link https://github.com/ramda/ramda-fantasy/blob/master/docs/Maybe.md}
 *
 * @external Maybe
 */

/**
 * A special object for triggering nodes without passing data.
 *
 * @typedef {Object} Pulse
 */

/**
 * @typedef {Object} Position
 * @property {number} x
 * @property {number} y
 */

/**
 * Adds a slash to the end of string if it doesn't exist
 * @private
 * @function ensureEndsWithSlash
 * @param {string} str
 * @returns {string}
 */
export const ensureEndsWithSlash = R.ifElse(
  R.compose(R.equals('/'), R.last),
  R.identity,
  R.concat(R.__, '/')
);

/**
 * Generates an id for entities
 * @private
 * @function generateId
 * @returns {string}
 */
export const generateId = shortid.generate;

/**
 * Validates an id of entities
 * @function validateId
 * @param {string} id
 * @returns {boolean}
 */
export const validateId = R.test(/^[a-zA-Z0-9\-_]+$/);

export const isGenericType = R.test(/^t[1-3]$/);

/**
 * Returns a default (empty) value for a given data type.
 *
 * @function defaultValueOfType
 * @param {PIN_TYPE} t
 * @returns {*}
 */
export const defaultValueOfType = def(
  'defaultValueOfType :: DataType -> DataValue',
  R.flip(R.propOr(''))(CONST.DEFAULT_VALUE_OF_TYPE)
);

export const canCastTypes = def(
  'canCastTypes :: DataType -> DataType -> Boolean',
  (from, to) => {
    if (from === to) return true;

    if (isGenericType(from) || isGenericType(to)) {
      return true;
    }

    return R.pathSatisfies(notNil, [from, to], CONST.CAST_NODES);
  }
);

export const isBuiltInType = def(
  'isBuiltInType :: String -> Boolean',
  isAmong(R.values(CONST.PIN_TYPE))
);

// =============================================================================
//
// Transforming node ids in the patch
//
// =============================================================================

/**
 * Returns a list of nodes with ids resolved
 * according to nodeIdMap.
 *
 * @private
 * @function resolveNodeIds
 * @param {Object.<string, number>} nodeIdMap
 * @param {Array<Node>} nodes
 * @returns {Array<Node>}
 */
// :: nodeIdMap -> Node[] -> Node[]
export const resolveNodeIds = R.curry((nodeIdMap, nodes) =>
  R.map(R.over(R.lensProp('id'), R.prop(R.__, nodeIdMap)), nodes)
);

// :: nodeIdMap -> PinRef -> PinRef
const resolvePinRefId = R.curry((nodeIdMap, pinRef) =>
  R.over(R.lensProp('nodeId'), R.prop(R.__, nodeIdMap), pinRef)
);

/**
 * Returns a list of links with resolved nodeIds
 * according to nodeIdMap.
 *
 * @private
 * @function resolveNodeIds
 * @param {Object.<string, number>} nodeIdMap
 * @param {Array<Link>} links
 * @returns {Array<Link>}
 */
export const resolveLinkNodeIds = R.curry((nodeIdMap, links) =>
  R.map(
    R.evolve({
      input: resolvePinRefId(nodeIdMap),
      output: resolvePinRefId(nodeIdMap),
    }),
    links
  )
);

// =============================================================================
// RegExp parts for `isValidNumberDataValue`
// =============================================================================

// Optional sign
const optSignRegExp = '(-|\\+)?';
// Digits or digits+dot or dot+digits or digits+dot+digits
const digitsWithDotRegExp = '(\\d+|\\d+\\.|\\.\\d+|\\d+\\.\\d+)';
// Optional scientific notation with exponential part
const scientificPartRegExp = `(e${optSignRegExp}\\d+)?`;
// Composited number regexp
const numberRegExp = `^${optSignRegExp}${digitsWithDotRegExp}${scientificPartRegExp}$`;
// NaN
const nanRegExp = '^NaN$';
// Inf, +Inf, -Inf
const infRegExp = `^${optSignRegExp}Inf$`;

// Whole RegExp for Number DataType
export const numberDataTypeRegExp = new RegExp(
  `${numberRegExp}|${nanRegExp}|${infRegExp}`
);

/**
 * Checks that String has a valid Number.
 *
 * Valid:
 * - Simple numbers: 10, 2.256, -0.123
 * - Floats with leading decimal point: .35, -.35, +.35
 * - Floats with trailing decimal point: 5., -3.
 * - Scientific notation: 5e3, -2e+3, .25e-1, 3.e5
 * - Not a number value: NaN
 * - Infinities: +Inf, -Inf
 */
export const isValidNumberDataValue = R.test(numberDataTypeRegExp);

//
// getting type from literal value
//

export const isValidPortLiteral = R.test(/^(P[A-F]|A|D)\d{0,3}$/g);

export const isLikeCharLiteral = def(
  'isLikeCharLiteral :: String -> Boolean',
  R.test(/^'\\?.'$/)
);

const unescapedCharLiterals = ["'''", "'\\'"];
export const isValidCharLiteral = def(
  'isValidCharLiteral :: String -> Boolean',
  R.both(isLikeCharLiteral, R.complement(isAmong(unescapedCharLiterals)))
);

export const isValidStringLiteral = def(
  'isValidStringLiteral :: String -> Boolean',
  R.either(isAmong(R.values(CONST.GLOBALS_LITERALS)), R.test(/^".*"$/gi))
);

export const isValidBooleanLiteral = def(
  'isValidBooleanLiteral :: String -> Boolean',
  isAmong(['True', 'False'])
);

export const isValidPulseLiteral = def(
  'isValidPulseLiteral :: String -> Boolean',
  isAmong(R.values(CONST.INPUT_PULSE_PIN_BINDING_OPTIONS))
);

export const isValidByteLiteral = def(
  'isValidByteLiteral :: String -> Boolean',
  R.either(isValidCharLiteral, R.test(/^[0-9a-f]{2}h|[0,1]{8}b|\d{1,3}d$/gi))
);

export const getTypeFromLiteral = def(
  'getTypeFromLiteral :: DataValue -> Either Error DataType',
  literal => {
    const invalidLiteral = () => fail('BAD_LITERAL_VALUE', { value: literal });
    const t = typeName => () => Either.of(typeName);

    return R.cond([
      // Literals always are Strings
      [R.complement(R.is(String)), invalidLiteral],
      // Deducers...
      [isValidBooleanLiteral, t(CONST.PIN_TYPE.BOOLEAN)],
      [isValidPulseLiteral, t(CONST.PIN_TYPE.PULSE)],
      [isValidStringLiteral, t(CONST.PIN_TYPE.STRING)],
      [isValidByteLiteral, t(CONST.PIN_TYPE.BYTE)],
      [isValidNumberDataValue, t(CONST.PIN_TYPE.NUMBER)],
      [isValidPortLiteral, t(CONST.PIN_TYPE.PORT)],
      ...R.zip(
        listCustomTypeLiteralValidators(),
        R.map(t, listCustomTypeNames())
      ),
      // Others — invalid
      [R.T, invalidLiteral],
    ])(literal);
  }
);

export const getTypeFromLiteralUnsafe = def(
  'getTypeFromLiteralUnsafe :: DataValue -> DataType',
  R.pipe(getTypeFromLiteral, explodeEither)
);

export const isValidLiteral = def(
  'isValidLiteral :: DataValue -> Boolean',
  R.pipe(getTypeFromLiteral, Either.isRight)
);
