open Jest;

open Expect;

open AtInternet;

let expectPromiseEq = (label: string, actual: 'a, expected: string) =>
  testPromise(label, () =>
    actual
    |> Js.Promise.then_(res =>
         Js.Promise.resolve(expect(res) |> toEqual(expected))
       )
    |> Js.Promise.catch(_ => {
         Js.log("CATCH");
         Js.Promise.resolve(
           fail(
             "Expected Promise.resolve("
             ++ expected
             ++ "), but got Promise.reject",
           ),
         );
       })
  );

let expectPromise = (label, actual, fn) =>
  testPromise(label, () =>
    actual |> Js.Promise.then_(res => Js.Promise.resolve(fn(res)))
  );

// TODO: Move into Belt_Holes ?
let mapPromise =
    (promise: Js.Promise.t('a), expectFn: 'a => 'b): Js.Promise.t('b) =>
  promise |> Js.Promise.then_(res => Js.Promise.resolve(expectFn(res)));

describe("AtInternet: basic", () => {
  let inetState = getDefaultState();

  test("MUX=false by default", () =>
    expect(isMux(inetState)) |> toBe(false)
  );

  testPromise("AT+CIPMUX switching", () => {
    let inetState = getDefaultState();
    execute(inetState, "AT+CIPMUX=1")
    ->mapPromise(res => (res, isMux(inetState)))
    |> Js.Promise.then_(firstRes =>
         execute(inetState, "AT+CIPMUX=0")
         ->mapPromise(res => (firstRes, (res, isMux(inetState))))
         ->mapPromise(actual =>
             expect(actual) |> toEqual((("OK", true), ("OK", false)))
           )
       );
  });
  // TODO: CIPMUX=1 after one established TCP connection should return ERR

  expectPromiseEq("AT -> OK", execute(inetState, "AT"), "OK");

  expectPromise("AT+CIFSR", execute(inetState, "AT+CIFSR"), res =>
    expect(res)
    |> toMatchRe([%re {|/^\+CIFSR:(STAIP|STAMAC),"([0-9a-z.:]+)"/m|}])
  );

  // TODO: CIPSTATUS: Very fragile test :-(
  expectPromiseEq(
    "AT+CIPSTATUS",
    execute(inetState, "AT+CIPSTATUS"),
    "STATUS:2",
  );

  expectPromise("AT+PING", execute(inetState, "AT+PING=\"google.com\""), res =>
    expect(res) |> toMatchRe([%re {|/^\+\d+\nOK/g|}])
  );

  expectPromise(
    "AT+CIPDOMAIN", execute(inetState, "AT+CIPDOMAIN=\"xod.io\""), res =>
    expect(res) |> toMatchRe([%re {|/^\+CIPDOMAIN:[a-z0-9.:]+\nOK/g|}])
  );

  expectPromise(
    "AT+CIPSTART (TCP, single, no keepAlive)",
    execute(inetState, "AT+CIPSTART=\"TCP\",\"35.184.230.84\",80"),
    res =>
    expect((res, hasConnections(inetState))) |> toEqual(("OK", true))
  );
  expectPromise(
    "AT+CIPSTART (SSL, single, no keepAlive)",
    execute(inetState, "AT+CIPSTART=\"SSL\",\"35.184.230.84\",443"),
    res =>
    expect((res, hasConnections(inetState))) |> toEqual(("OK", true))
  );
  // TODO: Test UDP

  expectPromiseEq(
    "AT+CIPCLOSE of not existing connection",
    execute(inetState, "AT+CIPCLOSE"),
    "OK",
  );

  testPromise("AT+CIPCLOSE of one connection", () => {
    let inetState = getDefaultState();
    execute(inetState, "AT+CIPSTART=\"TCP\",\"35.184.230.84\",80")
    |> Js.Promise.then_(r0 =>
         execute(inetState, "AT+CIPCLOSE=0")
         ->mapPromise(r1 => expect((r0, r1)) |> toEqual(("OK", "OK")))
       );
  });

  testPromise("AT+CIPCLOSE of all connection", () => {
    let inetState = getDefaultState();
    (
      execute(inetState, "AT+CIPMUX=1")
      |> Js.Promise.then_(_ =>
           execute(inetState, "AT+CIPSTART=0,\"TCP\",\"35.184.230.84\",80")
         )
      |> Js.Promise.then_(_ =>
           execute(inetState, "AT+CIPSTART=1,\"TCP\",\"35.184.230.84\",80")
         )
      |> Js.Promise.then_(_ => execute(inetState, "AT+CIPCLOSE=5"))
    )
    ->(mapPromise(_ => expect(hasConnections(inetState)) |> toBe(false)));
  });

  testPromise("TCP: Connect and send", () => {
    let inetState = getDefaultState();
    let request = "GET /httpbin/now HTTP/1.1\nHost: api.xod.io\n\n";
    let length = request->Js.String.length->Js.String.make;
    execute(inetState, "AT+CIPSTART=\"TCP\",\"35.184.230.84\",80")
    |> Js.Promise.then_(r0 =>
         execute(inetState, "AT+CIPSEND=" ++ length)
         ->mapPromise(r1 => (r0, r1))
       )
    |> Js.Promise.then_(((r0, r1)) =>
         send(inetState, request)
         ->mapPromise(r2 =>
             expect((r0, r1, r2))
             |> toEqual(("OK", "OK\n>", "Recv 44 bytes\n\nSEND OK"))
           )
       );
  });

  testAsync(
    "TCP: Connect, send and receive",
    ~timeout=5000,
    finish => {
      let inetState = getDefaultState();
      let request = "GET /httpbin/now HTTP/1.1\nHost: api.xod.io\n\n";
      let length = request->Js.String.length->Js.String.make;
      let response = ref("");
      (
        execute(inetState, "AT+CIPSTART=\"TCP\",\"35.184.230.84\",80")
        |> Js.Promise.then_(_ => execute(inetState, "AT+CIPSEND=" ++ length))
        |> Js.Promise.then_(_ => {
             listen(
               inetState,
               0,
               data => {
                 let newResponse = response^ ++ data;

                 if (Js.Re.test_([%re {|/HTTP\/1\.1 200 OK/gm|}], newResponse)) {
                   finish(pass);
                 };

                 response := newResponse;
               },
             )
             ->ignore;
             send(inetState, request);
           })
      )
      ->ignore;
    },
  );

  testAsync("Stream-like facade", finish => {
    create(
      answer => {
        Js.log(answer);
        if (answer === "OK") {
          finish(pass);
        } else {
          finish(
            fail("Expected to get `OK` answer, but got `" ++ answer ++ "`."),
          );
        };
      },
      "AT",
    )
  });
});
