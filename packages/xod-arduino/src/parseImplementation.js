import nearley from 'nearley';
import grammar from './implementationGrammar.ne.js';

export default impl => {
  const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

  parser.feed(impl);

  return parser.results[0];
};
