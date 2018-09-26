import * as R from 'ramda';
import path from 'path';
import { outputFile } from 'fs-extra';
import WebSocket from 'ws';
import atob from 'atob';
import { retryOrFail } from 'xod-func-tools';

import toPioMap from './toPio.json';
import {
  COMPILATION_RESPONSE_TYPES,
  COMPILATION_ERRORS,
  RESPONSE_TO_ERROR,
  DEFAULT_CLOUD_COMPILE_URL,
  RETRY_DELAYS,
} from './constants';

// CompileError :: { errorCode: String, message: String }

const createCompileError = (message, errorCode, payload = {}) =>
  Object.assign(new Error(message), { errorCode }, payload);

// :: () -> URL
const getCompileUrl = () =>
  process.env.XOD_CLOUD_COMPILE_URL || DEFAULT_CLOUD_COMPILE_URL;

/**
 * Sends board identifier and code to compilation server
 * and receives compiled binary file.
 *
 * We listen to errors or exactly success answer from server,
 * cause it could send useful messages for this pipeline, like ping/pong.
 * So we're ignoring them and wait only for error/success
 * message or close/fail connection event.
 *
 * Returns Promise with compiled binary file and filename or
 * Error object with required fields: `errorCode` and `message`
 * and optional `code`, `error`, `timeout`.
 */
// :: { board: String, body: String } -> Promise { data: String, name: String } CompileError
const sendAndReceive = dataToSend =>
  new Promise((resolve, reject) => {
    const ws = new WebSocket(getCompileUrl(), {
      perMessageDeflate: true,
      handshakeTimeout: 3000,
    });
    ws.on('open', () => ws.send(JSON.stringify(dataToSend)));
    ws.on('message', res => {
      const data = JSON.parse(res);

      const errCode = RESPONSE_TO_ERROR[data.type];
      if (errCode) {
        const errMessage = R.is(Object, data.body)
          ? JSON.stringify(data.body)
          : data.body;
        reject(createCompileError(errMessage, errCode));
      }

      if (data.type === COMPILATION_RESPONSE_TYPES.SUCCEEDED) {
        resolve(data.body);
      }
    });

    ws.on('close', (closeCode, reason) =>
      reject(
        createCompileError(reason, COMPILATION_ERRORS.CLOSED, { closeCode })
      )
    );

    ws.on('error', err =>
      reject(
        createCompileError(err.message, COMPILATION_ERRORS.FAILED, {
          code: err.code,
        })
      )
    );
  });

export const canCompile = fqbn => R.has(fqbn, toPioMap);
export const getPioBoardId = fqbn => R.prop(fqbn, toPioMap);

/**
 * Returns Promise with compilation result or error.
 * It will automatically retry to compile data if connection/timeout error occured.
 * If server returns a compilation error — it will return rejected Promise immediately.
 *
 * See docs for `sendAndReceive` and `retryOrFail`.
 */
// :: String -> String -> Promise { data: String, name: String } CompileError
export const compile = R.curry((board, code) => {
  const dataToSend = { board, body: code };

  return sendAndReceive(dataToSend).catch(
    retryOrFail(
      RETRY_DELAYS,
      data =>
        data.errorCode === COMPILATION_ERRORS.COMPILE_FAILED ||
        data.errorCode === COMPILATION_ERRORS.COMPILE_REJECTED,
      R.identity,
      () => sendAndReceive(dataToSend)
    )
  );
});

/**
 * It saves a compilation result (object with data and filename) into
 * specified directory as a binary file.
 * Returns a Promise with path to saved file or Error.
 */
// :: Path -> { data: String, name: String } -> Promise Path Error
export const saveCompiledBinary = R.curry((distPath, { data, name }) => {
  const ext = path.extname(name);
  const filepath = path.resolve(distPath, name);
  const dataToSave = ext === '.bin' ? atob(data) : data;

  return outputFile(filepath, dataToSave, 'binary').then(() => filepath);
});
