// A wrapper over the standard module `Net` from NodeJs

type t;
type port = int;
type host = string;

// Opens a TCP socket
let connect: (port, string) => t;

// Write data to the opened socket
let write: (t, string) => bool;

// Subscribe to some event on socket, like `data`, `closed` and etc
let on: (t, string, 'a => _) => t;

// Closes a TCP socket
let disconnect: (string, t) => Js.Promise.t(t);

// Sets keep alive property for the socket
let setKeepAlive: (bool, int, t) => t;
// Sets timeout to the socket
let setTimeout: (int, t) => t;
// Sets encoding of the data in the socket
let setEncoding: (string, t) => t;

// Gets local IP address
let localIp: t => host;
// Gets local Port
let localPort: t => port;

// Gets remote IP address
let remoteIp: t => host;
// Gets remote Port
let remotePort: t => port;

// A wrapper over `internet-available` module that checks that NodeJs has an internet connection
let isAvailable: unit => Js.Promise.t(bool);

// A wrapper over `tcp-ping` that pings some host
module Ping: {
  type params = {address: string};
  type response = {
    address: string,
    port: int,
    attempts: int,
    avg: float,
    max: float,
    min: float,
  };
};

// Pings host
let ping: host => Js.Promise.t(Ping.response);

// Gets an average ping from the Ping response
let getAveragePing: Ping.response => float;
