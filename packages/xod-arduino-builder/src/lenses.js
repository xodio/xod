import R from 'ramda';

import {
  IDE_EXECUTABLE_PATH,
  PACKAGES_PATH,
} from './constants';

// =============================================================================
//
// Lenses
//
// =============================================================================

/** Ramda lens to Arduino IDE executable {@link Path} in the config file.
 * @constant
 * @type Lens */
export const ide = R.lensProp(IDE_EXECUTABLE_PATH);

/** Ramda lens to Arduino IDE packages {@link Path} in the config file.
 * @constant
 * @type Lens */
export const packages = R.lensProp(PACKAGES_PATH);
