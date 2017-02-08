
import R from 'ramda';
import $ from 'sanctuary-def';
import HMP from 'hindley-milner-parser-js';

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

const constraints = sig => ({});

// :: TypeMap -> Signature -> [Type]
const types = R.curry((typemap, sig) => R.compose(
  R.map(R.prop(R.__, typemap)),
  R.pluck('text'), 
  R.filter(R.propEq('type', 'typeConstructor'))
)(sig));

// :: [Type] -> TypeMap
const typemap = R.indexBy(R.compose(
  R.last,
  R.split('/'),
  R.prop('name')
));

function create({ checkTypes, env }) {
  const $def = $.create({ checkTypes, env });

  return function def(signature, func) {
    const sig = HMP.parse(signature);
    //console.log('typemap', typemap(env));
    const sigTypes = types(typemap(env), sig.type.children);
    //console.log('sigTypes', sigTypes);
    return $def(sig.name, constraints(sig), sigTypes, func);
  }
}

export default {
  create
};
