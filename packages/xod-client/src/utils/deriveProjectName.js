import * as R from 'ramda';

// :: Filename -> ProjectName
export default R.compose(
  R.replace(/[^a-zA-Z0-9-]/g, ''),
  R.replace(/(\s|_|-+)/g, '-'),
  R.toLower,
  R.head,
  R.split('.')
);
