
import R from 'ramda';
import $ from 'sanctuary-def';

/*
From https://www.npmjs.com/package/hindley-milner-parser-js:

HMP.parse('hello :: Foo a => a -> String');
{
  name: 'hello',
  constraints: [
    {typeclass: 'Foo', typevar: 'a'}],
  type:
    {type: 'function', text: '', children: [
      {type: 'typevar', text: 'a', children: []},
      {type: 'typeConstructor', text: 'String', children: []}]};
*/

// type TypeMap = StrMap Type

export const constraints = sig => ({});

// :: {s: a} -> s -> a
const lookup = R.flip(R.prop);

const uncurry2 = R.uncurryN(2);

// :: TypeMap -> SignatureEntry -> Type
const convertTypeConstructor = R.useWith(lookup, [
  R.identity,
  R.prop('text'),
]);

// :: TypeMap -> SignatureEntry -> Type
const convertList = R.useWith(
  R.compose($.Array, uncurry2(convertType)), [
    R.identity,
    R.path(['children', 0])
  ]
);

// :: TypeMap -> SignatureEntry -> Type
function convertType(typeMap) {
  return R.cond([
    [R.propEq('type', 'typeConstructor'), convertTypeConstructor(typeMap)],
    [R.propEq('type', 'list'), convertList(typeMap)],
  ]);
}

// :: TypeMap -> ParsedSignature -> [Type]
export const types = R.curry((typeMap, sig) => R.map(convertType(typeMap), sig));

// :: String -> String
const stripNamespace = R.compose(R.last, R.split('/'));

// :: [Type] -> TypeMap
export const typemap = R.indexBy(R.compose(
  stripNamespace,
  R.prop('name')
));
