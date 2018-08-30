import * as R from 'ramda';
import { maybeProp, maybePath } from 'xod-func-tools';

export const getErrors = R.prop('errors');

export const getLastId = R.pipe(R.keys, R.reduce(R.max, 0));

export const getNewId = R.pipe(getLastId, R.inc);

// :: String -> Maybe Object
export const getMessageById = R.curry((msgId, state) =>
  R.compose(maybeProp(msgId), getErrors)(state)
);

// :: String -> Maybe Object
export const getMessageDataById = R.curry((msgId, state) =>
  R.compose(R.chain(maybePath(['payload', 'data'])), getMessageById)(
    msgId,
    state
  )
);
