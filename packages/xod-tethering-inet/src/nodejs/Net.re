type t;
type port = int;
type host = string;

[@bs.module "net"] [@bs.val] external connect: (port, string) => t = "connect";

[@bs.send] external write: (t, string) => bool = "write";
[@bs.send] external on_: (t, string, 'a => _) => unit = "on";

let on = (session: t, event: string, cb: 'a => _): t => {
  session->on_(event, cb);
  session;
};

[@bs.send.pipe: t] external disconnect_: string => t = "end";

let disconnect = (str: string, session: t) =>
  Js.Promise.make((~resolve, ~reject) => {
    session->on_("error", err => reject(. err));
    session->on_("close", _ => resolve(. session));
    session |> disconnect_(str) |> ignore;
  });

[@bs.send.pipe: t] external setKeepAlive: (bool, int) => t = "setKeepAlive";
[@bs.send.pipe: t] external setTimeout: int => t = "setTimeout";
[@bs.send.pipe: t] external setEncoding: string => t = "setEncoding";

[@bs.get] external localIp: t => host = "localAddress";

[@bs.get] external localPort: t => port = "localPort";

[@bs.get] external remoteIp: t => host = "remoteAddress";

[@bs.get] external remotePort: t => port = "remotePort";

// Internet-available

let isAvailable = [%bs.raw {| require("internet-available") |}];

// Tcp-ping

module Ping = {
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

[@bs.module "tcp-ping"] [@bs.val]
external ping_: (Ping.params, ('err, 'data) => unit) => unit = "ping";

let ping = (host: host): Js.Promise.t(Ping.response) =>
  Js.Promise.make((~resolve, ~reject) =>
    ping_({address: host}, (err, data) =>
      switch (Js.Nullable.toOption(err)) {
      | Some(err) => reject(. err)
      | None => resolve(. data)
      }
    )
  );

let getAveragePing = (pingData: Ping.response): float => pingData.avg;
