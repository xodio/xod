// A main file that exposes the interface to work with the package.

open Belt;

// :: [(Link, Net)]
type openConnections = List.t((Connection.Link.t, Net.t));

// :: (Link, Bytes to send, Bytes sent)
type sending = (Connection.Link.t, int, int);

// State
type t = {
  mux: ref(bool),
  sending: ref(sending),
  connections: ref(openConnections),
  events: EventEmitter.t,
};

// Creates an object with a default state
let getDefaultState: unit => t;

// Execute an AT command
let execute: (t, string) => Js.Promise.t(string);
// Send data to the transmition stream (TCP/UDP)
let send: (t, string) => Js.Promise.t(string);
// Is MUX mode turned on
let isMux: t => bool;
// Add handler for the TCP/UDP response
let listen: (t, Connection.Link.t, string => unit) => bool;
// Check does the internal state has an opened connection (TCP/UDP) with the specified LinkId (0-4)
let hasConnection: (t, Connection.Link.t) => bool;
// Check does the internal state has any opened connections (TCP/UDP)
let hasConnections: t => bool;

// Stream-like facade to simplify interaction with the package:

// Write AT commands or data to transmit in the single stream
// If the connection is opened and waiting for the data to transmit (AT+CIPSEND was sended)
// it will call `send` method, otherwise it will call `execute` method
let write: (t, string) => unit;
// Subscribe on any data received from the `execute` or `send` methods
let subscribe: (t, string => unit) => unit;

/**
 * Creates AtInternet object, which has an internal state and
 * methods to work with the Internet.
 */
let create: (string => unit, string) => unit;
