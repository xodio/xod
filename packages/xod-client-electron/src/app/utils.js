import R from 'ramda';
import { resolvePath } from 'xod-fs';

// Returns an array of default paths for current platform
// :: StrMap String String[] -> String[]
export const getPlatformSpecificPaths = R.compose(
  R.map(resolvePath),
  R.propOr([''], process.platform)
);

export default {
  getPlatformSpecificPaths,
};
