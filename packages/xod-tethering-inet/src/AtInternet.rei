open Belt;

type t = {
  // Execute an AT command
  execute: string => Js.Promise.t(string),
  // Send data to the transmition stream (TCP/UDP)
  send: string => Js.Promise.t(string),
  // Is MUX mode turned on
  isMux: unit => bool,
  // Add handler for the TCP/UDP response
  listen: (Connection.Link.t, string => unit) => bool,
  // Check does the internal state has an opened connection (TCP/UDP) with the specified LinkId (0-4)
  hasConnection: Connection.Link.t => bool,
  // Check does the internal state has any opened connections (TCP/UDP)
  hasConnections: unit => bool,
  // Stream-like facade to simplify interaction with the package:
  //
  // Write AT commands or data to transmit in the single stream
  // If the connection is opened and waiting for the data to transmit (AT+CIPSEND was sended)
  // it will call `send` method, otherwise it will call `execute` method
  write: string => unit,
  // Subscribe on any data received from the `execute` or `send` methods
  subscribe: (string => unit) => unit,
};

type openConnections = List.t((Connection.Link.t, Net.t));

// :: (Link, Bytes to send, Bytes sent)
type sending = (Connection.Link.t, int, int);

type stateT = {
  mux: ref(bool),
  sending: ref(sending),
  connections: ref(openConnections),
  events: EventEmitter.t,
};

let _create: unit => t;

/**
 * Creates AtInternet object, which has an internal state and
 * methods to work with the Internet.
 */
let create: (string => unit, string) => unit;
