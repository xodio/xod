// A connection describers and function to establish the connection using them.

open Belt;

module Host: {
  type t = string;
  let isIp: string => bool;
  let isHostname: string => bool;
  let validate: string => Result.t(t, Error.t);
};

module Port: {
  type t = int;
  let fromString: string => Result.t(t, Error.t);
};

module KeepAlive: {
  type t = int;
  let fromString: string => Result.t(t, Error.t);
};

// The AT command protocol assumes a maximum of 5 simultaneous connections.
// The Link type indicates the number of this connection.
module Link: {
  type t = int;
  let fromString: (string, bool) => Result.t(t, Error.t);
};

type t =
  | TCP(Host.t, Port.t, KeepAlive.t)
  | SSL(Host.t, Port.t, KeepAlive.t)
  // TODO: Add UDP local port & UDP modes?
  | UDP(Host.t, Port.t);

// Creates a Connection describer without opening a connection
let create: (string, Host.t, Port.t, KeepAlive.t) => Result.t(t, Error.t);

// Opens a connection using the Connection describer
let establish: t => Net.t;

// Formats a connection describer to the string
let stringify: t => string;
