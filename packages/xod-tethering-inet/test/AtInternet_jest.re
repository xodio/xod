open Jest;

open Expect;

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
  let inet = AtInternet._create();

  test("MUX=false by default", () =>
    expect(AtInternet._create().isMux()) |> toBe(false)
  );

  testPromise("AT+CIPMUX switching", () => {
    let inet = AtInternet._create();
    inet.execute("AT+CIPMUX=1")->mapPromise(res => (res, inet.isMux()))
    |> Js.Promise.then_(firstRes =>
         inet.execute("AT+CIPMUX=0")
         ->mapPromise(res => (firstRes, (res, inet.isMux())))
         ->mapPromise(actual =>
             expect(actual) |> toEqual((("OK", true), ("OK", false)))
           )
       );
  });
  // TODO: CIPMUX=1 after one established TCP connection should return ERR

  expectPromiseEq("AT -> OK", inet.execute("AT"), "OK");

  expectPromise("AT+CIFSR", inet.execute("AT+CIFSR"), res =>
    expect(res)
    |> toMatchRe([%re {|/^\+CIFSR:(STAIP|STAMAC),"([0-9a-z.:]+)"/m|}])
  );

  // TODO: CIPSTATUS: Very fragile test :-(
  expectPromiseEq("AT+CIPSTATUS", inet.execute("AT+CIPSTATUS"), "STATUS:2");

  expectPromise("AT+PING", inet.execute("AT+PING=\"google.com\""), res =>
    expect(res) |> toMatchRe([%re {|/^\+\d+\nOK/g|}])
  );

  expectPromise("AT+CIPDOMAIN", inet.execute("AT+CIPDOMAIN=\"xod.io\""), res =>
    expect(res) |> toMatchRe([%re {|/^\+CIPDOMAIN:[a-z0-9.:]+\nOK/g|}])
  );

  expectPromise(
    "AT+CIPSTART (TCP, single, no keepAlive)",
    inet.execute("AT+CIPSTART=\"TCP\",\"35.184.230.84\",80"),
    res =>
    expect((res, inet.hasConnections())) |> toEqual(("OK", true))
  );
  expectPromise(
    "AT+CIPSTART (SSL, single, no keepAlive)",
    inet.execute("AT+CIPSTART=\"SSL\",\"35.184.230.84\",443"),
    res =>
    expect((res, inet.hasConnections())) |> toEqual(("OK", true))
  );
  // TODO:
  // expectPromise(
  //   "AT+CIPSTART (UDP, single)",
  //   inet.execute("AT+CIPSTART=\"UDP\",\"35.184.230.84\",100"),
  //   res =>
  //   expect((res, inet.hasConnections())) |> toEqual(("OK", true))
  // );

  expectPromiseEq(
    "AT+CIPCLOSE of not existing connection",
    inet.execute("AT+CIPCLOSE"),
    "OK",
  );

  testPromise("AT+CIPCLOSE of one connection", () => {
    let inet = AtInternet._create();
    inet.execute("AT+CIPSTART=\"TCP\",\"35.184.230.84\",80")
    |> Js.Promise.then_(r0 =>
         inet.execute("AT+CIPCLOSE=0")
         ->mapPromise(r1 => expect((r0, r1)) |> toEqual(("OK", "OK")))
       );
  });

  testPromise("AT+CIPCLOSE of all connection", () => {
    let inet = AtInternet._create();
    (
      inet.execute("AT+CIPMUX=1")
      |> Js.Promise.then_(_ =>
           inet.execute("AT+CIPSTART=0,\"TCP\",\"35.184.230.84\",80")
         )
      |> Js.Promise.then_(_ =>
           inet.execute("AT+CIPSTART=1,\"TCP\",\"35.184.230.84\",80")
         )
      |> Js.Promise.then_(_ => inet.execute("AT+CIPCLOSE=5"))
    )
    ->(mapPromise(_ => expect(inet.hasConnections()) |> toBe(false)));
  });

  testPromise("TCP: Connect and send", () => {
    let inet = AtInternet._create();
    let request = "GET /httpbin/now HTTP/1.1\nHost: api.xod.io\n\n";
    let length = request->Js.String.length->Js.String.make;
    inet.execute("AT+CIPSTART=\"TCP\",\"35.184.230.84\",80")
    |> Js.Promise.then_(r0 =>
         inet.execute("AT+CIPSEND=" ++ length)->mapPromise(r1 => (r0, r1))
       )
    |> Js.Promise.then_(((r0, r1)) =>
         inet.send(request)
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
      let inet = AtInternet._create();
      let request = "GET /httpbin/now HTTP/1.1\nHost: api.xod.io\n\n";
      let length = request->Js.String.length->Js.String.make;
      let response = ref("");
      (
        inet.execute("AT+CIPSTART=\"TCP\",\"35.184.230.84\",80")
        |> Js.Promise.then_(_ => inet.execute("AT+CIPSEND=" ++ length))
        |> Js.Promise.then_(_ => {
             inet.listen(
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
             inet.send(request);
           })
      )
      ->ignore;
    },
  );
});

// TODO:
// describe("AtInternet — multiple connections", () => {});
