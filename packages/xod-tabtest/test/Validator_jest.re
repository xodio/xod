open Jest;

open Validator;

let assertNone = (expectation: option('a)) : assertion =>
  switch (expectation) {
  | None => pass
  | Some(_) => fail("Expected to get None, but got Some")
  };

let assertSomeError =
    (expectedMsg: string, optError: option(Js.Exn.t))
    : assertion =>
  switch (optError) {
  | Some(err) =>
    switch (Js.Exn.message(err)) {
    | Some(message) =>
      message === expectedMsg ?
        pass :
        fail(
          "Different error messages\n"
          ++ "Expected: \""
          ++ expectedMsg
          ++ "\""
          ++ "\nActual:   \""
          ++ message
          ++ "\"",
        )
    | None =>
      fail(
        "Expected to throw an error \""
        ++ expectedMsg
        ++ "\" but it throws an exception without error message.",
      )
    }
  | None =>
    fail(
      "Expected to throw an error \"" ++ expectedMsg ++ "\" but it does not.",
    )
  };

describe("Assert pin labels", () => {
  test("Returns unit for valid pin labels", () => {
    let realPins = ["IN1", "IN2", "IN3"];
    let tsvPins = ["IN1", "IN2", "IN3"];
    assertNone(validatePinLabels(realPins, tsvPins));
  });
  test("Throws missing pin labels error", () => {
    let realPins = ["IN1", "IN2", "IN3"];
    let tsvPins = ["IN1"];
    assertSomeError(
      {|INVALID_PIN_LABELS_IN_TABTEST {"missing":["IN2","IN3"],"redundant":[],"duplicated":[]}|},
      validatePinLabels(realPins, tsvPins),
    );
  });
  test("Throws redundant pin labels error", () => {
    let realPins = ["IN1"];
    let tsvPins = ["IN1", "IN2", "IN3"];
    assertSomeError(
      {|INVALID_PIN_LABELS_IN_TABTEST {"missing":[],"redundant":["IN2","IN3"],"duplicated":[]}|},
      validatePinLabels(realPins, tsvPins),
    );
  });
  test(
    "Do not throw a redundant pin labels error for special columns like `__time(ms)`",
    () => {
      let realPins = ["IN1"];
      let tsvPins = ["__time(ms)", "IN1"];
      assertNone(validatePinLabels(realPins, tsvPins));
    },
  );
  test("Throws duplicated pin labels error", () => {
    let realPins = ["IN1"];
    let tsvPins = ["IN1", "IN1", "IN1"];
    assertSomeError(
      {|INVALID_PIN_LABELS_IN_TABTEST {"missing":[],"redundant":[],"duplicated":["IN1"]}|},
      validatePinLabels(realPins, tsvPins),
    );
  });
  test("Throws duplicated pin labels error for special columns", () => {
    let realPins = ["IN1"];
    let tsvPins = ["__time(ms)", "IN1", "__time(ms)"];
    assertSomeError(
      {|INVALID_PIN_LABELS_IN_TABTEST {"missing":[],"redundant":[],"duplicated":["__time(ms)"]}|},
      validatePinLabels(realPins, tsvPins),
    );
  });
  test("Throws all pin labels error", () => {
    let realPins = ["IN1", "IN2", "IN3"];
    let tsvPins = ["IN1", "IN1", "IN4", "IN4"];
    assertSomeError(
      {|INVALID_PIN_LABELS_IN_TABTEST {"missing":["IN2","IN3"],"redundant":["IN4"],"duplicated":["IN1"]}|},
      validatePinLabels(realPins, tsvPins),
    );
  });
});
