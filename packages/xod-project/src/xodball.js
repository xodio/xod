import R from 'ramda';
import { Either } from 'ramda-fantasy';
import { foldEither } from 'xod-func-tools';

import { getPatchPath } from './patch';
import { listLibraryPatches, omitPatches } from './project';
import {
  addMissingOptionalProjectFields,
  omitEmptyOptionalProjectFields,
} from './optionalFieldsUtils';
import { ERROR } from './constants';
import { Project, def } from './types';

export const fromXodball = def(
  'fromXodball :: String -> Either String Project',
  jsonString => R.tryCatch(
      R.pipe(JSON.parse, Either.of),
      R.always(Either.Left(ERROR.NOT_A_JSON))
    )(jsonString)
      .map(addMissingOptionalProjectFields)
      .chain(project => foldEither(
        // Replace sanctuary-def validation error with our own
        R.always(Either.Left(ERROR.INVALID_XODBALL_FORMAT)),
        Either.of,
        Project.validate(project)
      ))
);

export const toXodball = def(
  'toXodball :: Project -> String',
  R.compose(
    p => JSON.stringify(p, null, 2),
    omitEmptyOptionalProjectFields,
    R.converge(
      omitPatches,
      [
        R.compose(
          R.map(getPatchPath),
          listLibraryPatches
        ),
        R.identity,
      ]
    )
  )
);
