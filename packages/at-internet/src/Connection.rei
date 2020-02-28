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

module Link: {
  type t = int;
  let fromString: (string, bool) => Result.t(t, Error.t);
};

type t =
  | TCP(Host.t, Port.t, KeepAlive.t)
  | SSL(Host.t, Port.t, KeepAlive.t)
  // TODO: Add UDP local port & UDP modes?
  | UDP(Host.t, Port.t);

let create: (string, Host.t, Port.t, KeepAlive.t) => Result.t(t, Error.t);

let establish: t => Net.t;

let stringify: t => string;
