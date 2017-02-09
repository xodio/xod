
import R from 'ramda';
import $ from 'sanctuary-def';
import HMP from 'hindley-milner-parser-js';
import * as Sig from '../src/signature';
import { expect } from 'chai';

describe('Signature', () => {
  const sigTypes = (env, sig) => Sig.types(
    Sig.typemap(env),
    HMP.parse(sig).type.children
  );

  it('should resolve built-in types', () => {
    const types = sigTypes($.env, 'foo :: Number -> String');
    expect(types).to.deep.equal([$.Number, $.String]);
  });

  it('should resolve user types', () => {
    const Widget = $.NullaryType('Widget', 'http://example.com/Widget', R.T);
    const env = R.append(Widget, $.env);
    const types = sigTypes(env, 'foo :: Widget -> String');
    expect(types).to.deep.equal([Widget, $.String]);
  });

  it('should resolve namespaced user types', () => {
    const Widget = $.NullaryType('x/y/z/Widget', 'http://example.com/Widget', R.T);
    const env = R.append(Widget, $.env);
    const types = sigTypes(env, 'foo :: Widget -> String');
    expect(types).to.deep.equal([Widget, $.String]);
  });
});
