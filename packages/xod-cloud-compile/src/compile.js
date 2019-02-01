/* eslint-disable prettier/prettier */
import * as R from 'ramda';
import btoa from 'btoa';
import fetch from 'node-fetch';
import { createError, notNil } from 'xod-func-tools';

import arduinoH from 'xod-tabtest/cpp/Arduino.h';
import arduinoCpp from 'xod-tabtest/cpp/Arduino.cpp';
import xStringFormatInl from '../../../cpplib/catch2utils/XStringFormat.inl';

import * as EC from './errorCodes';

// :: String -> Nullable String -> StrMap Source -> Object -> Promise Object Error
const compile = R.curry((hostname, accessToken, suite, opts) => {
  const reqUrl = `https://api.${hostname}/compile/enqueue`;
  const reqBody = R.compose(
    R.merge(opts),
    filesMap => ({
      payload: filesMap,
    }),
    R.map(btoa),
    R.when(
      () => opts.fqbn === 'wasm:tabtest:2',
      R.merge({
        'Arduino.cpp': arduinoCpp,
        'Arduino.h': arduinoH,
        'XStringFormat.inl': xStringFormatInl,
      })
    )
  )(suite);

  const headers = R.when(
    () => notNil(accessToken),
    R.assoc('Authorization', `Bearer ${accessToken}`)
  )({
    'Content-Type': 'application/json',
  });

  return fetch(reqUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(reqBody),
  })
    .catch(err =>
      Promise.reject(createError(EC.WASM_COMPILATION_RESULTS_FETCH_ERROR, { message: err.message }))
    )
    .then(res => {
      if (!res.ok) {
        return res.json().then(json => Promise.reject(
          createError(EC.WASM_COMPILATION_ERROR, json)
        ));
      }
      return res;
    })
    .then(res => res.json());
});

// :: String -> Nullable String -> StrMap Source -> Promise
export const compileTabtest = R.curry((hostname, accessToken, suite) =>
  compile(hostname, accessToken, suite, {
    fqbn: 'wasm:tabtest:2',
    options: {},
  })
);

// :: String -> Nullable String -> Source -> Promise
export const compileSimulation = R.curry((hostname, accessToken, programCode) => {
  const suite = {
    'sketch.ino': programCode,
  };
  return compile(hostname, accessToken, suite, {
    fqbn: 'wasm:simulation',
    options: {},
  })
});
