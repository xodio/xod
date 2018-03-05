import * as R from 'ramda';
import { Either } from 'ramda-fantasy';

export const sanctuaryDefEitherToRamdaFantasyEither = sdEither =>
  sdEither.isLeft ? Either.Left(sdEither.value) : Either.Right(sdEither.value);

export const validateSanctuaryType = R.uncurryN(2, SanctuaryType =>
  R.compose(
    sanctuaryDefEitherToRamdaFantasyEither,
    SanctuaryType.validate.bind(SanctuaryType)
  )
);
