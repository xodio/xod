import * as R from 'ramda';

/**
 * Debugger log could contain messages of a different types:
 * - system  - system information, like "Debug session started"
 * - log     - string, that readed from SerialPort without special formating
 * - xod     - string, that readed from SerialPort with special formating,
 *             like `+XOD:3215:12:somedata` (for watch nodes and etc)
 * - error   - system errors or errors, that readed from SerialPort
 *             all error messages should starts with "Error: " to be
 *             parsed as "error" type
 */

//------------------------------------------------------------------------------
//
// Constants
//
//------------------------------------------------------------------------------

export const DEBUGGER_MESSAGE_TYPES = {
  SYSTEM: 'system',
  LOG: 'log',
  XOD: 'xod',
  ERROR: 'error',
};

//------------------------------------------------------------------------------
//
// Utils
//
//------------------------------------------------------------------------------

// :: String -> SystemMessage
export const createSystemMessage = message => ({
  type: DEBUGGER_MESSAGE_TYPES.SYSTEM,
  message,
});

// :: String -> LogMessage
export const createLogMessage = message => ({
  type: DEBUGGER_MESSAGE_TYPES.LOG,
  message,
});

const xodMessageRegExp = /^(\+\w+):(\d+):(\d+):(.+)/;

// :: String -> Boolean
export const isXodMessage = R.test(xodMessageRegExp);

// :: String -> XodMessage
export const createXodMessage = input =>
  R.compose(
    R.applySpec({
      type: R.always(DEBUGGER_MESSAGE_TYPES.XOD),
      prefix: R.nth(1),
      timecode: R.nth(2),
      nodeId: R.nth(3),
      content: R.nth(4),
    }),
    R.when(R.isEmpty, () => {
      throw new Error(
        `Canʼt create XOD debugger message from string: "${input}"`
      );
    }),
    R.match(xodMessageRegExp)
  )(input);

// :: Error -> ErrorMessage
export const createErrorMessage = err => ({
  type: DEBUGGER_MESSAGE_TYPES.ERROR,
  message: err.message,
  stack: err.stack,
});
//------------------------------------------------------------------------------
//
// Message parser
//
//------------------------------------------------------------------------------

// :: String -> (LogMessage | XodMessage)
export const parseDebuggerMessage = R.ifElse(
  isXodMessage,
  createXodMessage,
  createLogMessage
);
