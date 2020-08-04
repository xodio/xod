import * as R from 'ramda';
import Handlebars from 'handlebars';

const isContentStatement = st => st.type === 'ContentStatement';
const getContentStatementValue = st => st.value;

const isGeneratedCodeStatement = st =>
  st.type === 'MustacheStatement' && st.path.original === 'GENERATED_CODE';

const isGlobalBlock = st =>
  st.type === 'BlockStatement' && st.path.original === 'global';
const getGlobalBlockValue = st =>
  st.program.body[0] ? getContentStatementValue(st.program.body[0]) : '';

const globalsLens = R.lensProp('globals');
const beforeNodeLens = R.lensProp('beforeNodeImplementation');
const insideNodeLens = R.lensProp('insideNodeImplementation');

// Impl -> { globals: String, beforeNodeImplementation: String, insideNodeImplementation: String }
export default R.compose(
  R.map(R.join('\n')),
  R.dissoc('encounteredGeneratedCodeStatement'),
  R.reduce(
    (acc, st) => {
      if (isGeneratedCodeStatement(st)) {
        return R.assoc('encounteredGeneratedCodeStatement', true, acc);
      } else if (isGlobalBlock(st)) {
        return R.over(globalsLens, R.append(getGlobalBlockValue(st)), acc);
      } else if (isContentStatement(st)) {
        return R.over(
          acc.encounteredGeneratedCodeStatement
            ? insideNodeLens
            : beforeNodeLens,
          R.append(getContentStatementValue(st)),
          acc
        );
      }

      // should not get there normally
      return acc;
    },
    {
      encounteredGeneratedCodeStatement: false,
      globals: [],
      beforeNodeImplementation: [],
      insideNodeImplementation: [],
    }
  ),
  R.prop('body'),
  Handlebars.parse
);
