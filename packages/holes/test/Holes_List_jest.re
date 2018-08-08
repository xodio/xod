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
