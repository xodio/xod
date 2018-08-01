open Belt;
open Jest;
open Expect;

describe("groupBy", () =>
  test("splits a list into a sublists stored in a map", () => {
    let outMap =
      Holes.List.groupBy(
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
