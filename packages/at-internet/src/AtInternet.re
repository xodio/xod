open Belt;

type t = {
  execute: string => Js.Promise.t(string),
  send: string => Js.Promise.t(string),
  isMux: unit => bool,
  listen: (Connection.Link.t, string => unit) => bool,
  hasConnection: Connection.Link.t => bool,
  hasConnections: unit => bool,
  write: string => unit,
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

let getDefaultState = () => {
  let state: stateT = {
    mux: ref(false),
    sending: ref(((-1), 0, 0)),
    connections: ref([]),
    events: EventEmitter.create(),
  };
  state;
};

// UTILS
let resolve = Js.Promise.resolve;

// METHODS

let hasConnection = (state, linkId) =>
  List.hasAssoc(state.connections^, linkId, (===));
let hasConnections = state => List.length(state.connections^) > 0;
let isMux = state => state.mux^;

let listen = (state, linkId, handler) =>
  List.getAssoc(state.connections^, linkId, (==))
  ->Option.map(session => session->Net.on("data", handler))
  ->Option.isSome;

let handleCommand = (state: stateT, cmd: Command.t): Js.Promise.t(string) =>
  switch (cmd) {
  | AT => resolve("OK")
  | CIPMUX(a) =>
    if (!hasConnections(state)) {
      state.mux := a;
      resolve("OK");
    } else {
      resolve("ERR");
    }
  | CIFSR =>
    Address.mac()
    |> Js.Promise.then_(mac =>
         resolve(
           "+CIFSR:STAIP,\""
           ++ Address.ip()
           ++ "\""
           ++ "\n"
           ++ "+CIFSR:STAMAC,\""
           ++ mac
           ++ "\""
           ++ "\n",
         )
       )
  | CIPSTATUS =>
    // TODO: Add info about opened connections
    Net.isAvailable()
    |> Js.Promise.then_(_ => resolve("STATUS:2"))
    |> Js.Promise.catch(_ => resolve("SATUS:5"))
  | PING(host) =>
    Net.ping(host)
    |> Js.Promise.then_(data => {
         resolve(
           "+"
           ++ (data |> Net.getAveragePing |> Int.fromFloat |> Js.String.make)
           ++ "\nOK",
         )
       })
    |> Js.Promise.catch(_ => resolve("+timeout\nERROR"))
  | CIPDOMAIN(host) =>
    host
    |> Dns.lookup
    |> Js.Promise.then_(ip => resolve("+CIPDOMAIN:" ++ ip ++ "\nOK"))
    |> Js.Promise.catch(_ => resolve("DNS Fail\nERROR"))
  | CIPSTART(linkId, connection) =>
    if (!isMux(state) && linkId !== 0) {
      resolve("ERROR");
    } else if (hasConnection(state, linkId)) {
      resolve("ALREADY CONNECTED");
    } else {
      let session = Connection.establish(connection);
      Js.Promise.make((~resolve, ~reject) =>
        session
        ->Net.on("connect", () => {
            state.connections :=
              List.setAssoc(state.connections^, linkId, session, (==));
            // Pass the socket data into main data stream
            listen(
              state,
              linkId,
              data => {
                let dataLen = Js.String.length(data);
                state.events
                ->EventEmitter.emit(
                    "data",
                    "IPD," ++ Js.String.make(dataLen) ++ ":" ++ data,
                  );
              },
            )
            ->ignore;
            resolve(. "OK");
          })
        ->Net.on("error", err => {reject(. err)})
        ->Net.on("close", () => {
            state.connections :=
              List.removeAssoc(state.connections^, linkId, (==));
            state.events
            ->EventEmitter.emit(
                "data",
                "CONNETION_CLOSED" ++ Js.String.make(linkId),
              );
          })
        ->ignore
      )
      |> Js.Promise.catch(_ => resolve("ERROR"));
    }
  | CIPSEND(linkId, length) =>
    List.getAssoc(state.connections^, linkId, (==))
    |> (
      connection =>
        switch (connection) {
        | None => resolve("ERROR")
        | Some(_) =>
          state.sending := (linkId, length, 0);
          resolve("OK\n>");
        }
    )
  | CIPCLOSE(5) =>
    List.map(state.connections^, ((_, session)) =>
      session |> Net.disconnect("")
    )
    |> List.toArray
    |> Js.Promise.all
    |> Js.Promise.then_(_ => resolve("OK"))
  | CIPCLOSE(linkId) =>
    switch (List.getAssoc(state.connections^, linkId, (==))) {
    | None => resolve("OK")
    | Some(session) =>
      session |> Net.disconnect("") |> Js.Promise.then_(_ => resolve("OK"))
    }
  };

let send = (state, data) => {
  let (linkId, requestLength, sentLength) = state.sending^;
  List.getAssoc(state.connections^, linkId, (==))
  |> (
    connection =>
      switch (connection) {
      | None => resolve("ERROR")
      | Some(session) =>
        let written = session->Net.write(data);
        let dataLen = Js.String.length(data);
        let newSentLength = sentLength + dataLen;
        state.sending := (linkId, requestLength, newSentLength);

        if (written && newSentLength >= requestLength) {
          state.sending := ((-1), 0, 0);
          resolve(
            "Recv "
            ++ Js.String.make(newSentLength)
            ++ " bytes\n"
            ++ "\n"
            ++ "SEND OK",
          );
        } else if (written) {
          resolve("");
        } else {
          resolve("ERROR");
        };
      }
  );
};

let execute = (state, cmd) =>
  cmd
  |> Command.parse
  |> (
    res =>
      switch (res) {
      | Result.Ok(a) => a |> handleCommand(state)
      | Result.Error(_) => Js.Promise.resolve("ERR")
      }
  );

let isSendingMode = state =>
  switch (state.sending^) {
  | ((-1), _, _) => false
  | _ => true
  };

let ensureNl = str =>
  str
  |> Js.String.replaceByRe([%re {|/\\r\\n$/|}], "\r\n")
  |> Js.String.replaceByRe([%re {|/\\n$/|}], "\n")
  |> (s => Js.String.endsWith("\n", s) ? s : s ++ "\r\n");

let write = (state, data) =>
  (
    isSendingMode(state)
      ? send(state, ensureNl(data)) : execute(state, data)
  )
  |> Js.Promise.then_(answer => {
       state.events->EventEmitter.emit("data", answer)->ignore;
       resolve(answer);
     })
  |> Js.Promise.catch(_ => {
       state.events->EventEmitter.emit("data", "ERROR")->ignore;
       resolve("ERROR");
     })
  |> ignore;

let subscribe = (state, handler) =>
  state.events->(EventEmitter.on("data", handler))->ignore;

let _create = (): t => {
  let state = getDefaultState();
  let o: t = {
    send: send(state),
    listen: listen(state),
    hasConnection: hasConnection(state),
    hasConnections: () => hasConnections(state),
    isMux: () => isMux(state),
    execute: execute(state),
    write: write(state),
    subscribe: subscribe(state),
  };
  o;
};

let create = (onDataHandler: string => unit): (string => unit) => {
  let net = _create();
  net.subscribe(onDataHandler);
  net.write;
};
