open Belt;

open Jest;

open Expect;

describe("groupByString", () =>
  test("splits a list into a sublists stored in a Map.String", () => {
    let outMap =
      Holes.List.groupByString(
        ["foo", "Foo", "Bar", "FOO", "bAr", "baz"],
        String.lowercase,
      );
    let expectedMap =
      Map.String.fromArray([|
        ("foo", ["foo", "Foo", "FOO"]),
        ("bar", ["Bar", "bAr"]),
        ("baz", ["baz"]),
      |]);
    expect(outMap) |> Holes_Map_String_jest.toEqualMap(expectedMap);
  })
);

let formatMap = m => {
  let s = Map.toArray(m);
  {j|$s|j};
};

let toEqualMap = (ym, expectation) => {
  let xm =
    switch (expectation) {
    | `Just(xm) => xm
    | _ => Js.Exn.raiseError("toEqualMap supports only plain `expect`ations")
    };
  Map.eq(xm, ym, (==)) ?
    pass :
    fail(
      "Maps differ\n"
      ++ "Expected: "
      ++ formatMap(ym)
      ++ "\nActual:   "
      ++ formatMap(xm),
    );
};

describe("groupBy", () =>
  test("splits a list into a sublists stored in a Map", () => {
    module Cmp =
      Belt.Id.MakeComparable(
        {
          type t = (int, int);
          let cmp = Pervasives.compare;
        },
      );
    let outMap =
      Holes.List.groupBy(
        [(1, "aaa"), (1, "bbb"), (2, "aaa"), (1, "cccc")],
        (module Cmp),
        ((n, s)) =>
        (n, String.length(s))
      );
    let expectedMap =
      Map.fromArray(
        [|
          ((1, 3), [(1, "aaa"), (1, "bbb")]),
          ((2, 3), [(2, "aaa")]),
          ((1, 4), [(1, "cccc")]),
        |],
        ~id=(module Cmp),
      );
    expect(outMap) |> toEqualMap(expectedMap);
  })
);
