open Belt;

open Jest;

open Expect;

open Command;

describe("Command", () => {
  test("returns UNKNOWN COMMAND error for empty string", () =>
    expect(parse("")) |> toEqual(Result.Error(Error.UNKNOWN_COMMAND))
  );
  test("returns UNKNOWN COMMAND error for command not from the list", () =>
    expect(parse("lalala")) |> toEqual(Result.Error(Error.UNKNOWN_COMMAND))
  );

  let testCommand = (input, expected) =>
    test("parses `" ++ input ++ "`", () =>
      switch (parse(input)) {
      | Result.Ok(a) when a == expected => pass
      | Result.Ok(a) => fail("Got another Result.Ok(" ++ stringify(a) ++ ")")
      | Result.Error(a) => fail("Got an error: " ++ Error.stringify(a))
      }
    );

  let argumentsError = (error: Error.t, input: string) =>
    test(
      "returns " ++ Error.stringify(error) ++ " error for `" ++ input ++ "`",
      () =>
      switch (parse(input)) {
      | Result.Ok(a) =>
        fail("Expected error, but got Result.Ok(" ++ stringify(a) ++ ")")
      | Result.Error(a) when a == error => pass
      | Result.Error(b) =>
        fail(
          "Expected "
          ++ Error.stringify(error)
          ++ " error, but got "
          ++ Error.stringify(b),
        )
      }
    );

  testCommand("AT", AT);
  testCommand("AT+CIPSTATUS", CIPSTATUS);
  testCommand("AT+CIFSR", CIFSR);

  testCommand("AT+CIPMUX=0", CIPMUX(false));
  testCommand("AT+CIPMUX=1", CIPMUX(true));
  argumentsError(Error.EXPECTED_ARGUMENTS(1), "AT+CIPMUX");
  argumentsError(Error.EXPECTED_ARGUMENTS(1), "AT+CIPMUX=");
  argumentsError(Error.EXPECTED_ARGUMENTS(1), "AT+CIPMUX=,");
  argumentsError(Error.INVALID_ARGUMENTS, "AT+CIPMUX=2");
  argumentsError(Error.INVALID_ARGUMENTS, "AT+CIPMUX=\"lala\"");

  testCommand("AT+PING=\"192.168.0.1\"", PING("192.168.0.1"));
  testCommand("AT+PING=\"google.com\"", PING("google.com"));
  argumentsError(Error.EXPECTED_ARGUMENTS(1), "AT+PING");
  argumentsError(Error.INVALID_ARGUMENTS, "AT+PING=google.com");

  testCommand("AT+CIPDOMAIN=\"google.com\"", CIPDOMAIN("google.com"));
  argumentsError(Error.EXPECTED_ARGUMENTS(1), "AT+CIPDOMAIN");
  argumentsError(
    Error.INVALID_ARGUMENTS,
    "AT+CIPDOMAIN=\"google.com\", \"xod.io\"",
  );

  let ip: Connection.Host.t = "192.168.0.1";
  let port: Connection.Port.t = 8000;
  let dontKeepAlive: Connection.KeepAlive.t = 0;
  let keepAlive: Connection.KeepAlive.t = 7200; //max
  let tcp = Connection.TCP(ip, port, dontKeepAlive);
  let tcpAlive = Connection.TCP(ip, port, keepAlive);

  // Simple TCP
  testCommand("AT+CIPSTART=\"TCP\",\"192.168.0.1\",8000", CIPSTART(0, tcp));
  // With Link ID
  testCommand(
    "AT+CIPSTART=4,\"TCP\",\"192.168.0.1\",8000",
    CIPSTART(4, tcp),
  );
  // With KeepAlive
  testCommand(
    "AT+CIPSTART=\"TCP\",\"192.168.0.1\",8000,7200",
    CIPSTART(0, tcpAlive),
  );
  argumentsError(Error.EXPECTED_ARGUMENTS(3), "AT+CIPSTART");
  argumentsError(Error.EXPECTED_ARGUMENTS(3), "AT+CIPSTART=\"TCP\"");
  argumentsError(
    Error.EXPECTED_ARGUMENTS(3),
    "AT+CIPSTART=\"TCP\",\"192.168.0.1\"",
  );
  argumentsError(
    Error.EXPECTED_ARGUMENTS(3),
    "AT+CIPSTART=0, \"TCP\",\"192.168.0.1\",8000,7200,5",
  );
  argumentsError(
    Error.INVALID_ARGUMENTS,
    "AT+CIPSTART=\"TCP\",\"192.168.0.1\",8000,7200,5",
  );
  argumentsError(
    Error.INVALID_PORT("\"lala\""),
    "AT+CIPSTART=\"TCP\",\"192.168.0.1\",\"lala\"",
  );
  argumentsError(
    Error.INVALID_PORT("0"),
    "AT+CIPSTART=\"TCP\",\"192.168.0.1\",0",
  );
  argumentsError(
    Error.INVALID_KEEPALIVE("9600"),
    "AT+CIPSTART=\"TCP\",\"192.168.0.1\",8000,9600",
  );
  argumentsError(
    Error.INVALID_CONNECTION_TYPE("TCP/IP"),
    "AT+CIPSTART=\"TCP/IP\",\"192.168.0.1\",8000",
  );
  argumentsError(
    Error.INVALID_LINKID("-1"),
    "AT+CIPSTART=-1,\"TCP\",\"192.168.0.1\",8000",
  );
  argumentsError(
    Error.INVALID_LINKID("5"),
    "AT+CIPSTART=5,\"TCP\",\"192.168.0.1\",8000",
  );

  testCommand("AT+CIPSEND=42", CIPSEND(0, 42));
  testCommand("AT+CIPSEND=32500", CIPSEND(0, 32500));
  testCommand("AT+CIPSEND=1,32500", CIPSEND(1, 32500));
  argumentsError(
    Error.INVALID_ARGUMENTS,
    "AT+CIPSEND=1,\"string is not allowed here\"",
  );

  testCommand("AT+CIPCLOSE", CIPCLOSE(0));
  testCommand("AT+CIPCLOSE=1", CIPCLOSE(1));
  testCommand("AT+CIPCLOSE=5", CIPCLOSE(5));
  argumentsError(Error.INVALID_ARGUMENTS, "AT+CIPCLOSE=\"bye\"");
  argumentsError(Error.EXPECTED_ARGUMENTS(1), "AT+CIPCLOSE=1,2");
});

describe("Parse arguments", () => {
  test("returns empty list of command without arguments at all", () =>
    expect(parseArguments("AT")) |> toHaveLength(0)
  );
  test("returns empty list for empty string", () =>
    expect(parseArguments("")) |> toHaveLength(0)
  );
  test("returns empty list for empty list of arguments", () =>
    expect(parseArguments("AT=")) |> toHaveLength(0)
  );
  test("returns empty list for empty arguments with commas", () =>
    expect(parseArguments("AT=,,,")) |> toHaveLength(0)
  );

  test("returns a list of one argument", () => {
    let args = parseArguments("AT=1");
    expect(args) |> toHaveLength(1);
  });
  test("returns a list of two arguments", () =>
    expect(parseArguments("AT=1,2")) |> toHaveLength(2)
  );
  test("returns a list of three arguments", () =>
    expect(parseArguments("AT=1,\"ABC\",3")) |> toHaveLength(3)
  );
  test("returns a list of four arguments", () =>
    expect(parseArguments("AT=1,\"ABC\",\"192.168.0.1\",8"))
    |> toHaveLength(4)
  );
});
