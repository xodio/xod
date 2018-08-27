import * as R from 'ramda';
import { catMaybies } from 'xod-func-tools';
import { getLibraryNameFromUrl } from 'xod-arduino-deploy';

/**
 * Returns a comma separated and wrapped with quotes library names.
 * :: [String] -> String
 */
export default R.pipe(
  R.map(getLibraryNameFromUrl),
  catMaybies, // If there is any Error in the URL it should throw error earlier
  R.map(name => `"${name}"`),
  R.join(', ')
);
