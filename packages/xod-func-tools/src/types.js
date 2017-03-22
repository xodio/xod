import R from 'ramda';
import $ from 'sanctuary-def';
import $type from 'sanctuary-type-identifiers';
import HMDef from 'hm-def';

/* Types are by convention starts with a capital leter, so: */
/* eslint-disable new-cap */

//-----------------------------------------------------------------------------
//
// Type utilities
//
//-----------------------------------------------------------------------------

const removeLastSlash = R.replace(/\/$/, '');

export const createTypeUtils = (typePath, docUrl) => {
  // :: String -> String
  const qualifiedTypeName = typeName => `${removeLastSlash(typePath)}/${typeName}`;

  // :: String -> String
  const typeUrl = typeName => `${docUrl}${typeName}`;

  // :: (String, Any -> Boolean) -> Type
  const NullaryType = (typeName, predicate) => $.NullaryType(
    qualifiedTypeName(typeName),
    typeUrl(typeName),
    predicate
  );

  // :: (String, [Any]) -> Type
  const EnumType = (typeName, values) => $.EnumType(
    qualifiedTypeName(typeName),
    typeUrl(typeName),
    values
  );

  // :: Type -> Any -> Boolean
  const hasType = type => x => type.validate(x).isRight;

  // :: [Type] -> (Any -> Boolean)
  const hasOneOfType = types => R.anyPass(
    R.map(hasType, types)
  );

  const Model = (typeName, schema) => NullaryType(
    typeName,
    hasType($.RecordType(schema))
  );

  const OneOfType = (typeName, types) => NullaryType(
    typeName,
    hasOneOfType(types)
  );

  const AliasType = (typeName, type) => NullaryType(
    typeName,
    hasType(type)
  );

  return {
    // type defs
    NullaryType,
    EnumType,
    Model,
    OneOfType,
    AliasType,
    // utils
    hasType,
    hasOneOfType,
  };
};

const Utils = createTypeUtils('xod-func-tools', 'http://xod.io/docs/dev/xod-func-tools/#');

//-----------------------------------------------------------------------------
//
// Fantasy land types
//
//-----------------------------------------------------------------------------

// For some reason `type` function from 'sanctuary-type-identifiers' don't work
// correctly with moands from 'ramda-fantasy'. So there is a little hack.
const checkFantasyMonad = R.curry((expectedType, obj) => {
  const eq = fn => R.compose(R.equals(expectedType), fn);
  return R.anyPass([
    eq(R.path(['constructor', 'prototype', '@@type'])),
    eq($type),
  ])(obj);
});

const maybeTypeId = 'ramda-fantasy/Maybe';
export const $Maybe = $.UnaryType(
  maybeTypeId,
  'https://github.com/ramda/ramda-fantasy/blob/master/docs/Maybe.md',
  checkFantasyMonad(maybeTypeId),
  maybe => (maybe.isJust ? [maybe.value] : [])
);

const eitherTypeId = 'ramda-fantasy/Either';
export const $Either = $.BinaryType(
  eitherTypeId,
  'https://github.com/ramda/ramda-fantasy/blob/master/docs/Either.md',
  checkFantasyMonad(eitherTypeId),
  either => (either.isLeft ? [either.value] : []),
  either => (either.isRight ? [either.value] : [])
);

//-----------------------------------------------------------------------------
//
// Environment
//
//-----------------------------------------------------------------------------

export const env = $.env.concat([
  $Either,
  $Maybe,
]);

export const def = HMDef.create({ checkTypes: true, env });
