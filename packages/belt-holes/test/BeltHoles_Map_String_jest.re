open Belt;

open Jest;

open Expect;

let formatMap = m => {
  let s = Map.String.toArray(m);
  {j|$s|j};
};

let toEqualMap = (ym, expectation) => {
  let xm =
    switch (expectation) {
    | `Just(xm) => xm
    | _ => Js.Exn.raiseError("toEqualMap supports only plain `expect`ations")
    };
  Map.String.eq(xm, ym, (==)) ?
    pass :
    fail(
      "Maps differ\n"
      ++ "Expected: "
      ++ formatMap(ym)
      ++ "\nActual:   "
      ++ formatMap(xm),
    );
};

describe("Key mapping", () => {
  test("changes keys, preserves data", () => {
    let inMap =
      Map.String.empty
      |. Map.String.set("one", 1)
      |. Map.String.set("two", 2)
      |. Map.String.set("three", 3);
    let outMap = inMap |. BeltHoles.Map.String.mapKeys(Js.String.toUpperCase);
    let expectedMap =
      Map.String.empty
      |. Map.String.set("ONE", 1)
      |. Map.String.set("TWO", 2)
      |. Map.String.set("THREE", 3);
    expect(outMap) |> toEqualMap(expectedMap);
  });
  test("supports swaps", () => {
    let inMap =
      Map.String.empty
      |. Map.String.set("foo", "was foo")
      |. Map.String.set("oof", "was oof");
    let outMap = inMap |. BeltHoles.Map.String.mapKeys(BeltHoles.String.reverse);
    let expectedMap =
      Map.String.empty
      |. Map.String.set("oof", "was foo")
      |. Map.String.set("foo", "was oof");
    expect(outMap) |> toEqualMap(expectedMap);
  });
});

describe("Inner join", () =>
  test("applies transitive associations", () => {
    let left =
      Map.String.empty
      |. Map.String.set("quad", "four")
      |. Map.String.set("hexa", "six")
      |. Map.String.set("octo", "eight");
    let right =
      Map.String.empty
      |. Map.String.set("four", 4)
      |. Map.String.set("six", 6)
      |. Map.String.set("eight", 8);
    let outMap = BeltHoles.Map.String.innerJoin(left, right);
    let expectedMap =
      Map.String.empty
      |. Map.String.set("quad", 4)
      |. Map.String.set("hexa", 6)
      |. Map.String.set("octo", 8);
    expect(outMap) |> toEqualMap(expectedMap);
  })
);

describe("mergeOverride", () =>
  test("merges preferring keys from second arg", () => {
    let left =
      Map.String.empty
      |. Map.String.set("quad", "four")
      |. Map.String.set("hexa", "six");
    let right =
      Map.String.empty
      |. Map.String.set("quad", "4")
      |. Map.String.set("octo", "8");
    let outMap = BeltHoles.Map.String.mergeOverride(left, right);
    let expectedMap =
      Map.String.empty
      |. Map.String.set("quad", "4")
      |. Map.String.set("hexa", "six")
      |. Map.String.set("octo", "8");
    expect(outMap) |> toEqualMap(expectedMap);
  })
);
