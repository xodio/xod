import * as R from 'ramda';
import AtNet from 'xod-tethering-inet';
import client from 'xod-client';
import { allPromises } from 'xod-func-tools';
import { ipcRenderer } from 'electron';

import { DEBUG_SERIAL_SEND } from '../shared/events';

const EOT = String.fromCharCode(4); // end of transmittion
const ACK = String.fromCharCode(6); // acknowledge

const formatUnhandledTetheringErrorMessage = err => ({
  title: 'Tethering Internet Error',
  note: err.message,
  solution: 'If you believe this is a bug, report it to XOD developers.',
});

// Places the new chunks in the end of mutable `chunksToSend` list (SIDE-EFFECT)
// :: [String] -> [String]
const queueChunks = dispatch => newChunks =>
  dispatch(client.tetheringInetChunksAdded(newChunks));

// :: String -> [String]
// Pack data into chunks, if needed:
// - Simple AT answers just placed inside array
// - IPD (Incoming Package Data) is splited on chunks of max bytes chunks length
//   with prepended prefix `+XOD:{nodeId}:{dataLength}:`
// For the Serial connection prefered chunk size 63 bytes due to Serial buffer size
// For the Simulation the chunk size might be greater than for Serial.
const splitDataOnChunks = R.curry((maxChunkSize, nodeId, data) => {
  if (data.length > 0) {
    const prefix = `+XOD:${nodeId}:`;
    const pkgSize = 3; // max 2 digits + delimeter: "63:"
    const dataMaxLength = maxChunkSize - pkgSize - prefix.length;

    const formatChunk = chunkData =>
      R.compose(
        R.concat(prefix),
        R.concat(chunkData.length.toString(10)),
        R.concat(':')
      )(chunkData);

    return R.cond([
      [
        R.startsWith('IPD'),
        R.compose(
          R.map(formatChunk),
          R.splitEvery(dataMaxLength),
          R.slice(R.__, data.length, data),
          R.add(1),
          R.indexOf(':')
        ),
      ],
      [R.startsWith('CONNETION_CLOSED'), () => [formatChunk(EOT)]], // TODO: Support MUX
      // Synchronous responses
      [R.T, R.of],
    ])(data);
  }
  return [];
});

// :: (Action -> *) -> (String -> _) -> (_ -> _)
const createTransmitter = (dispatch, sender) =>
  R.compose(
    R.map(sender),
    dispatch, // returns Maybe Chunk
    client.tetheringInetChunkSent
  );

// :: (Action -> *) -> (_ -> _) -> NodeId -> (String -> _)
const createListener = (dispatch, transmit, nodeId) =>
  R.compose(transmit, queueChunks(dispatch), splitDataOnChunks(63, nodeId));

const isReadOkResponse = R.startsWith(ACK);

// In case that the connection is closed before than all request has been received
// there is no reason to continue sending the response data.
const clearQueueOnCloseConnection = R.curry((dispatch, command) =>
  R.when(
    R.equals('AT+CIPCLOSE'),
    R.compose(dispatch, client.tetheringInetClearChunks)
  )(command)
);

export default ({ getState, dispatch }) => next => action => {
  const state = getState();
  const result = next(action);

  // Simulation
  if (
    action.type === client.SIMULATION_LAUNCHED &&
    action.payload.tetheringInetNodeId !== null
  ) {
    const nodeId = action.payload.tetheringInetNodeId;
    const worker = action.payload.worker;
    const transmit = createTransmitter(dispatch, worker.sendToWasm);
    const listener = createListener(dispatch, transmit, nodeId);
    const write = R.compose(
      AtNet.create(listener),
      R.tap(clearQueueOnCloseConnection(dispatch))
    );
    dispatch(
      client.tetheringInetCreated(
        action.payload.tetheringInetNodeId,
        write,
        transmit
      )
    );
  }

  // Debug
  if (
    action.type === client.DEBUG_SESSION_STARTED &&
    action.payload.tetheringInetNodeId !== null
  ) {
    const nodeId = action.payload.tetheringInetNodeId;
    const transmit = createTransmitter(dispatch, chunk =>
      ipcRenderer.send(DEBUG_SERIAL_SEND, chunk)
    );
    const listener = createListener(dispatch, transmit, nodeId);
    const write = AtNet.create(listener);
    dispatch(
      client.tetheringInetCreated(
        action.payload.tetheringInetNodeId,
        write,
        transmit
      )
    );
  }

  // Send command to AtInternet either for Simulation or Debug
  if (action.type === client.DEBUGGER_LOG_ADD_MESSAGES) {
    const write = client.tetheringInetSender(state);
    const transmit = client.tetheringInetTransmitter(state);
    if (!write) return result;

    const isTetheringMessage = R.compose(
      R.propEq('nodeId'),
      R.toString, // Message data contains NodeId in string format
      client.tetheringInetNodeId
    )(state);

    R.compose(
      allPromises,
      R.map(R.ifElse(isReadOkResponse, transmit, write)),
      R.pluck('content'),
      R.filter(isTetheringMessage)
    )(action.payload).catch(err => {
      dispatch(client.addError(formatUnhandledTetheringErrorMessage(err)));
      // eslint-disable-next-line no-console
      console.error(err);
    });
  }

  return result;
};
