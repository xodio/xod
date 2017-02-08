
import $ from 'sanctuary-def';
import HMP from 'hindley-milner-parser-js';

export default function def(signature, func) {
  const sig = HMP.parse(signature);
  console.log(sig);
  return func;
}
