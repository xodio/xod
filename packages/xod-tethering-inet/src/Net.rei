type t;
type port = int;
type host = string;

let connect: (port, string) => t;

let write: (t, string) => bool;
let on: (t, string, 'a => _) => t;

let disconnect: (string, t) => Js.Promise.t(t);
let setKeepAlive: (bool, int, t) => t;
let setTimeout: (int, t) => t;
let setEncoding: (string, t) => t;

let localIp: t => host;
let localPort: t => port;

let remoteIp: t => host;
let remotePort: t => port;

// Internet-available
let isAvailable: unit => Js.Promise.t(bool);

// Tcp-ping
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

let ping: host => Js.Promise.t(Ping.response);

let getAveragePing: Ping.response => float;
