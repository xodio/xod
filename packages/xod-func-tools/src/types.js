import * as R from 'ramda';
import $ from 'sanctuary-def';
import $type from 'sanctuary-type-identifiers';
import HMDef from 'hm-def';

/* Types are by convention starts with a capital leter, so: */
/* eslint-disable new-cap */

const pkgName = 'xod-func-tools';
const dUrl = 'http://xod.io/docs/dev/xod-func-tools/#';

//-----------------------------------------------------------------------------
//
// Type utilities
//
//-----------------------------------------------------------------------------

// For some reason `type` function from 'sanctuary-type-identifiers' don't work
// correctly with moands from 'ramda-fantasy'. So there is a little hack.
// Also it used to test 'sanctuary-def/Type'.
const checkTypeId = R.curry((expectedType, obj) => {
  const eq = fn => R.compose(R.equals(expectedType), fn);
  return R.anyPass([
    eq(R.path(['constructor', 'prototype', '@@type'])),
    eq($type),
  ])(obj);
});

const removeLastSlash = R.replace(/\/$/, '');
// qualifiedTypeName :: String -> String -> String
const qualifiedTypeName = R.curry(
  (packageName, typeName) => `${removeLastSlash(packageName)}/${typeName}`
);
// typeUrl :: String -> String -> String
const typeUrl = R.curry(
  (docUrl, typeName) => `${docUrl}${typeName}`
);

// hasType :: Type -> (x -> Boolean)
export const hasType = R.curry(
  (type, x) => type.validate(x).isRight
);

// hasOneOfType :: [Type] -> (x -> Boolean)
export const hasOneOfType = R.curry(
  types => R.anyPass(
    R.map(hasType, types)
  )
);

// NullaryType :: String -> String -> String -> (Any -> Boolean) -> Type
export const NullaryType = R.curry(
  (packageName, docUrl, typeName, predicate) => $.NullaryType(
    qualifiedTypeName(packageName, typeName),
    typeUrl(docUrl, typeName),
    predicate
  )
);

// UnaryType :: String -> String -> String -> (Any -> Boolean) -> (t a -> Array a) -> (Type -> Type)
export const UnaryType = R.curry(
  (packageName, docUrl, typeName, predicate, extractor) => $.UnaryType(
    qualifiedTypeName(packageName, typeName),
    typeUrl(docUrl, typeName),
    predicate,
    extractor
  )
);

// BinaryType :: String -> String -> String -> (Any -> Boolean) -> (t a b -> Array a) ->
// -> (t a b -> Array b) -> (Type -> Type -> Type)
export const BinaryType = R.curry(
  (packageName, docUrl, typeName, predicate, extractorA, extractorB) => $.BinaryType(
    qualifiedTypeName(packageName, typeName),
    typeUrl(docUrl, typeName),
    predicate,
    extractorA,
    extractorB
  )
);

// EnumType :: String -> String -> String -> [a] -> Type
export const EnumType = R.curry(
  (packageName, docUrl, typeName, values) => $.EnumType(
    qualifiedTypeName(packageName, typeName),
    typeUrl(docUrl, typeName),
    values
  )
);

// For those who loves pain we have strict type checking mode that ignores
// @@type hints and thus dead slow
// :: Any -> Boolean
const hasTypeHint = process.env.XOD_HM_DEF === 'strict' ? R.F : R.has('@@type');

// Model :: String -> String -> String -> StrMap Type -> Type
export const Model = R.curry(
  (packageName, docUrl, typeName, schema) => NullaryType(
    packageName,
    docUrl,
    typeName,
    R.ifElse(
      hasTypeHint,
      R.propEq('@@type', qualifiedTypeName(packageName, typeName)),
      hasType($.RecordType(schema))
    )
  )
);

// OneOfType :: String -> String -> String -> [Type] -> Type
export const OneOfType = R.curry(
  (packageName, docUrl, typeName, types) => NullaryType(
    packageName,
    docUrl,
    typeName,
    hasOneOfType(types)
  )
);

// AliasType :: String -> String -> String -> Type -> Type
export const AliasType = R.curry(
  (packageName, docUrl, typeName, type) => NullaryType(
    packageName,
    docUrl,
    typeName,
    hasType(type)
  )
);

//-----------------------------------------------------------------------------
//
// General purpose types
//
//-----------------------------------------------------------------------------

export const Map = BinaryType(
  pkgName, dUrl,
  'Map',
  R.is(Object),
  R.keys,
  R.values
);

export const Pair = BinaryType(
  pkgName, dUrl,
  'Pair',
  x => x instanceof Array && x.length === 2,
  R.compose(R.of, R.head),
  R.compose(R.of, R.last)
);

export const $Promise = NullaryType(
  pkgName, dUrl,
  'Promise',
  x => x instanceof Promise,
);

//-----------------------------------------------------------------------------
//
// Fantasy land types
//
//-----------------------------------------------------------------------------

const maybeTypeId = 'ramda-fantasy/Maybe';
export const $Maybe = $.UnaryType(
  maybeTypeId,
  'https://github.com/ramda/ramda-fantasy/blob/master/docs/Maybe.md',
  checkTypeId(maybeTypeId),
  maybe => (maybe.isJust ? [maybe.value] : [])
);

const eitherTypeId = 'ramda-fantasy/Either';
export const $Either = $.BinaryType(
  eitherTypeId,
  'https://github.com/ramda/ramda-fantasy/blob/master/docs/Either.md',
  checkTypeId(eitherTypeId),
  either => (either.isLeft ? [either.value] : []),
  either => (either.isRight ? [either.value] : [])
);

//-----------------------------------------------------------------------------
//
// Environment
//
//-----------------------------------------------------------------------------

export const env = $.env.concat([
  Map($.Unknown, $.Unknown),
  Pair($.Unknown, $.Unknown),
  $Promise,
  $Either($.Unknown, $.Unknown),
  $Maybe($.Unknown),
]);

export const def = HMDef.create({
  checkTypes: !!process.env.XOD_HM_DEF,
  env,
});
