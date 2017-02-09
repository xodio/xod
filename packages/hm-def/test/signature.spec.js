
import R from 'ramda';
import $ from 'sanctuary-def';
import HMP from 'hindley-milner-parser-js';
import * as Sig from '../src/signature';
import { assert } from 'chai';

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
  assert.deepEqual(wipeFunctions(actual), wipeFunctions(expected));
}

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
});
