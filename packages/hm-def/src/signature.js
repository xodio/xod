
import R from 'ramda';

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

// :: String -> String
const stripNamespace = R.compose(R.last, R.split('/'));

// :: TypeMap -> ParsedSignature -> [Type]
export const types = R.curry((typemap, sig) => R.compose(
  R.map(R.prop(R.__, typemap)),
  R.pluck('text'), 
  R.filter(R.propEq('type', 'typeConstructor'))
)(sig));

// :: [Type] -> TypeMap
export const typemap = R.indexBy(R.compose(
  stripNamespace,
  R.prop('name')
));
