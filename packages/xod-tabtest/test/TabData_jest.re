open Belt;

open Jest;

open Expect;

open TabData.Value;

describe("TSV parser", () => {
  test("parses empty tsv into empty data", () =>
    expect(TabData.parse("")) |> toEqual([])
  );
  test("parses header-only tsv into empty data", () =>
    expect(TabData.parse("foo\tBAR\tBaz")) |> toEqual([])
  );
  test("parses header and a line into a single record", () => {
    let tsv = "foo\tBAR\tBaz\n" ++ "111\t222\t333\n";
    let expected: TabData.t = [
      Map.String.empty
      |. Map.String.set("foo", Number(111.0))
      |. Map.String.set("BAR", Number(222.0))
      |. Map.String.set("Baz", Number(333.0)),
    ];
    expect(TabData.parse(tsv)) |> toEqual(expected);
  });
  test("ignores empty lines", () => {
    let tsv = "foo\tBAR\tBaz\n" ++ "\n\n" ++ "111\t222\t333\n" ++ "\n\n";
    let expected: TabData.t = [
      Map.String.empty
      |. Map.String.set("foo", Number(111.0))
      |. Map.String.set("BAR", Number(222.0))
      |. Map.String.set("Baz", Number(333.0)),
    ];
    expect(TabData.parse(tsv)) |> toEqual(expected);
  });
  test("matches data to header by shortest sequence", () => {
    let tsv = "foo\tBAR\tBaz\n" ++ "111\t222\n" ++ "111\t222\t333\t444\n";
    let expected: TabData.t = [
      Map.String.empty
      |. Map.String.set("foo", Number(111.0))
      |. Map.String.set("BAR", Number(222.0)),
      Map.String.empty
      |. Map.String.set("foo", Number(111.0))
      |. Map.String.set("BAR", Number(222.0))
      |. Map.String.set("Baz", Number(333.0)),
    ];
    expect(TabData.parse(tsv)) |> toEqual(expected);
  });
  test("recognizes types", () => {
    let tsv =
      "Number\tBoolean\tString\n"
      ++ "+.5\ttrue\t\"Hello\"\n"
      ++ "1.3\tfalse\t\"Some \"quoted\" string\"";
    let expected: TabData.t = [
      Map.String.empty
      |. Map.String.set("Number", Number(0.5))
      |. Map.String.set("Boolean", Boolean(true))
      |. Map.String.set("String", String("Hello")),
      Map.String.empty
      |. Map.String.set("Number", Number(1.3))
      |. Map.String.set("Boolean", Boolean(false))
      |. Map.String.set("String", String({|Some "quoted" string|})),
    ];
    expect(TabData.parse(tsv)) |> toEqual(expected);
  });
});
