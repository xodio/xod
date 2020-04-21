open Belt;

module Host = {
  type t = string;

  let ipRegExp = [%re {|/^(\d{1,3}).(\d{1,3}).(\d{1,3}).(\d{1,3})$/|}];
  let hostnameRegExp = [%re
    {|/^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/|}
  ];

  let isIp = Js.Re.test_(ipRegExp);
  let isHostname = Js.Re.test_(hostnameRegExp);

  let validate = str =>
    isIp(str) || isHostname(str)
      ? Result.Ok(str) : Result.Error(Error.INVALID_HOSTNAME(str));
};
module Port = {
  type t = int;

  let fromString = str =>
    Int.fromString(str)
    |> (
      res =>
        switch (res) {
        | Some(a) when a > 0 => Result.Ok(a)
        | _ => Result.Error(Error.INVALID_PORT(str))
        }
    );
};
module KeepAlive = {
  type t = int;

  let fromString = str =>
    Int.fromString(str)
    |> (
      res =>
        switch (res) {
        | Some(a) when a <= 7200 && a >= 0 => Result.Ok(a)
        | Some(_) => Result.Error(Error.INVALID_KEEPALIVE(str))
        | None => Result.Error(Error.INVALID_ARGUMENTS)
        }
    );
};
module Link = {
  type t = int;

  let fromString = (str, allowFive) =>
    Int.fromString(str)
    |> (
      res =>
        switch (res) {
        | Some(a) when a >= 0 && a <= (allowFive ? 5 : 4) => Result.Ok(a)
        | Some(_) => Result.Error(Error.INVALID_LINKID(str))
        | None => Result.Error(Error.INVALID_ARGUMENTS)
        }
    );
};

type t =
  | TCP(Host.t, Port.t, KeepAlive.t)
  | SSL(Host.t, Port.t, KeepAlive.t)
  | UDP(Host.t, Port.t);

let create = (typeStr, host, port, keepAlive) =>
  switch (typeStr) {
  | "TCP" => Result.Ok(TCP(host, port, keepAlive))
  | "UDP" => Result.Ok(UDP(host, port))
  | "SSL" => Result.Ok(SSL(host, port, keepAlive))
  | _ => Result.Error(Error.INVALID_CONNECTION_TYPE(typeStr))
  };

let establish = (connection: t): Net.t =>
  switch (connection) {
  | SSL(host, port, keepAlive)
  | TCP(host, port, keepAlive) =>
    Net.connect(port, host)
    |> Net.setEncoding("utf8")
    |> Net.setKeepAlive(keepAlive > 0, keepAlive)
    |> Net.setTimeout(3000)
  | UDP(host, port) => Net.connect(port, host) // TODO
  };

let stringify = conn =>
  switch (conn) {
  | TCP(host, port, keepAlive) =>
    "\"TCP\",\""
    ++ host
    ++ "\","
    ++ Js.String.make(port)
    ++ (keepAlive > 0 ? "," ++ Js.String.make(keepAlive) : "")
  | SSL(host, port, keepAlive) =>
    "\"TCP\",\""
    ++ host
    ++ "\","
    ++ Js.String.make(port)
    ++ (keepAlive > 0 ? "," ++ Js.String.make(keepAlive) : "")
  | UDP(host, port) => "\"UDP\",\"" ++ host ++ "\"," ++ Js.String.make(port)
  };
