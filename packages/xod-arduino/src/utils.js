import * as R from 'ramda';

import * as XP from 'xod-project';
import { def } from './types';

// :: x -> Number
export const toInt = R.flip(parseInt)(10);

export const kebabToSnake = R.replace(/-/g, '_');

// foo(number,string) -> foo__number__string
export const sanitizeTypeSpecification = R.compose(
  R.replace(/\(|,/g, '__'),
  R.replace(')', '')
);

export const createPatchNames = def(
  'createPatchNames :: PatchPath -> { owner :: String, libName :: String, patchName :: String }',
  R.compose(
    R.map(kebabToSnake),
    R.applySpec({
      owner: R.ifElse(XP.isPathLibrary, XP.getOwnerName, R.always('')),
      libName: R.ifElse(
        XP.isPathLibrary,
        R.pipe(R.split('/'), R.nth(1)),
        R.always('')
      ),
      patchName: R.pipe(XP.getBaseName, sanitizeTypeSpecification),
    })
  )
);
