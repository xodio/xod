
import $ from 'sanctuary-def';
import HMP from 'hindley-milner-parser-js';
import * as Sig from './signature';

function create({ checkTypes, env }) {
  const $def = $.create({ checkTypes, env });

  return function def(signature, func) {
    const sig = HMP.parse(signature);
    const sigTypes = Sig.types(Sig.typemap(env), sig.type.children);
    return $def(sig.name, Sig.constraints(sig), sigTypes, func);
  }
}

export default {
  create
};
