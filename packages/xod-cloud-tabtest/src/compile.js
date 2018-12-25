/* eslint-disable prettier/prettier */
import * as R from 'ramda';
import btoa from 'btoa';
import fetch from 'node-fetch';
import { createError } from 'xod-func-tools';

import arduinoH from 'xod-tabtest/cpp/Arduino.h';
import arduinoCpp from 'xod-tabtest/cpp/Arduino.cpp';
import xStringFormatInl from '../../../cpplib/catch2utils/XStringFormat.inl';

import * as EC from './errorCodes';

// :: String -> StrMap Source -> Promise
const compileSuite = R.curry((hostname, suite) => {
  const reqUrl = `https://api.${hostname}/compile/enqueue`;
  const reqBody = R.compose(
    JSON.stringify.bind(JSON),
    filesMap => ({
      fqbn: 'wasm:tabtest',
      options: {
        emscriptenVersion: '1.38.21',
        compilerFlags: '-O1 -std=c++11 -I. -fno-exceptions -fno-rtti',
        linkerFlags:
          "-O1 -s WASM=1 -s FILESYSTEM=0 -s BINARYEN_TRAP_MODE=clamp -s MODULARIZE=1 -s EXPORT_ES6=1 -s EXTRA_EXPORTED_RUNTIME_METHODS=[] -s EXPORTED_FUNCTIONS=['_main'] -s MALLOC=emmalloc -s NODEJS_CATCH_EXIT=0 -s DEAD_FUNCTIONS=[] -s DEFAULT_LIBRARY_FUNCS_TO_INCLUDE=[] -s DYNAMIC_EXECUTION=2 -s TEXTDECODER=0 -s ASSERTIONS=1",
        includeRuntime: false,
        catch2Version: '2.5.0',
      },
      payload: filesMap,
    }),
    R.map(btoa),
    R.merge({
      'Arduino.cpp': arduinoCpp,
      'Arduino.h': arduinoH,
      'XStringFormat.inl': xStringFormatInl,
    })
  )(suite);

  return fetch(reqUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: reqBody,
  })
    .catch(err =>
      Promise.reject(createError(EC.TABTEST_COMPILATION_RESULTS_FETCH_ERROR, { message: err.message }))
    )
    .then(res => {
      if (!res.ok) {
        return res.json().then(json => Promise.reject(
          createError(EC.TABTEST_COMPILATION_ERROR, json)
        ));
      }
      return res;
    })
    .then(res => res.json());
});

export default compileSuite;
