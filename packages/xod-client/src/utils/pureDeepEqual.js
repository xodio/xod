import R from 'ramda';
import { shouldUpdate } from 'recompose';

export default shouldUpdate(R.complement(R.equals));
