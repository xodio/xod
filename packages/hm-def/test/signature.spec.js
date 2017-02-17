
import R from 'ramda';
import $ from 'sanctuary-def';
import HMP from 'hm-parser';
import { assert } from 'chai';
import * as Sig from '../src/signature';

// :: Any -> Any
function wipeFunctions(x) {
  return R.cond([
    [R.is(Function), R.always('[Function]')],
    [R.is(Array), R.map(wipeFunctions)],
    [R.is(Object), R.map(wipeFunctions)],
    [R.T, R.identity],
  ])(x);
}

function assertDeepEqual(actual, expected, message) {
  assert.deepEqual(wipeFunctions(actual), wipeFunctions(expected), message);
}

// Debugging utility
// eslint-disable-next-line no-unused-vars, no-console
function logHMP(sig) { console.log(JSON.stringify(HMP.parse(sig), null, 2)); }

/* Types are by convention starts with a capital leter, so: */
/* eslint-disable new-cap */

describe('Signature', () => {
  const sigTypes = (env, sig) => Sig.types(
    Sig.typemap(env),
    HMP.parse(sig).type.children
  );

  it('should resolve built-in types', () => {
    const types = sigTypes($.env, 'foo :: Number -> String');
    assertDeepEqual(types, [$.Number, $.String]);
  });

  it('should resolve user types', () => {
    const Widget = $.NullaryType('Widget', 'http://example.com/Widget', R.T);
    const env = R.append(Widget, $.env);
    const types = sigTypes(env, 'foo :: Widget -> String');
    assertDeepEqual(types, [Widget, $.String]);
  });

  it('should resolve namespaced user types', () => {
    const Widget = $.NullaryType('x/y/z/Widget', 'http://example.com/Widget', R.T);
    const env = R.append(Widget, $.env);
    const types = sigTypes(env, 'foo :: Widget -> String');
    assertDeepEqual(types, [Widget, $.String]);
  });

  it('should resolve lists', () => {
    const types = sigTypes($.env, 'foo :: [Number] -> [String]');
    assertDeepEqual(types, [$.Array($.Number), $.Array($.String)]);
  });

  it('should resolve functions', () => {
    const types = sigTypes($.env, 'foo :: Number -> (Number -> Number)');
    assertDeepEqual(types, [$.Number, $.Function([$.Number, $.Number])]);
  });

  it('should resolve typevars', () => {
    const a = $.TypeVariable('a');
    const b = $.TypeVariable('b');
    const types = sigTypes($.env, 'foo :: a -> b -> a');
    assertDeepEqual(types, [a, b, a]);
  });

  it('should resolve maybes', () => {
    const Maybe = $.UnaryType(
      'my-package/Maybe',
      'http://example.com/my-package#Maybe',
      R.T,
      R.always([])
    );

    const env = R.append(Maybe, $.env);
    const types = sigTypes(env, 'foo :: Maybe String -> String');
    assertDeepEqual(types, [Maybe($.String), $.String]);
  });

  it('should resolve eithers', () => {
    const Either = $.BinaryType(
      'my-package/Either',
      'http://example.com/my-package#Either',
      R.T,
      R.always([]),
      R.always([])
    );

    const env = R.append(Either, $.env);
    const types = sigTypes(env, 'foo :: Either String Number -> String');
    assertDeepEqual(types, [Either($.String, $.Number), $.String]);
  });

  it('should resolve thunks', () => {
    const types = sigTypes($.env, 'foo :: () -> Number');
    assertDeepEqual(types, [$.Number]);
  });

  it('should resolve records', () => {
    const types = sigTypes($.env, 'foo :: { value :: Number } -> Number');
    assertDeepEqual(types, [$.RecordType({ value: $.Number }), $.Number]);
  });
});
