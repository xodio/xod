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
      Map.String.fromArray([|
        ("foo", Number(111.0)),
        ("BAR", Number(222.0)),
        ("Baz", Number(333.0)),
      |]),
    ];
    expect(TabData.parse(tsv)) |> toEqual(expected);
  });
  test("ignores empty lines", () => {
    let tsv = "foo\tBAR\tBaz\n" ++ "\n\n" ++ "111\t222\t333\n" ++ "\n\n";
    let expected: TabData.t = [
      Map.String.fromArray([|
        ("foo", Number(111.0)),
        ("BAR", Number(222.0)),
        ("Baz", Number(333.0)),
      |]),
    ];
    expect(TabData.parse(tsv)) |> toEqual(expected);
  });
  test("matches data to header by shortest sequence", () => {
    let tsv = "foo\tBAR\tBaz\n" ++ "111\t222\n" ++ "111\t222\t333\t444\n";
    let expected: TabData.t = [
      Map.String.fromArray([|
        ("foo", Number(111.0)),
        ("BAR", Number(222.0)),
      |]),
      Map.String.fromArray([|
        ("foo", Number(111.0)),
        ("BAR", Number(222.0)),
        ("Baz", Number(333.0)),
      |]),
    ];
    expect(TabData.parse(tsv)) |> toEqual(expected);
  });
  test("recognizes types", () => {
    let tsv =
      "Number\tBoolean\tByte\tString\n"
      ++ "+.5\ttrue\t00h\t\"Hello\"\n"
      ++ "-42\ttrue\t00001101b\t\"World\"\n"
      ++ "-1.243~\tfalse\t11111111b\t\"!\"\n"
      ++ "1.3\tfalse\t255d\t\"Some \"quoted\" string\"";
    let expected: TabData.t = [
      Map.String.fromArray([|
        ("Number", Number(0.5)),
        ("Boolean", Boolean(true)),
        ("Byte", Byte(0)),
        ("String", String("Hello")),
      |]),
      Map.String.fromArray([|
        ("Number", Number(-42.0)),
        ("Boolean", Boolean(true)),
        ("Byte", Byte(13)),
        ("String", String("World")),
      |]),
      Map.String.fromArray([|
        ("Number", ApproxNumber(-1.243, 3)),
        ("Boolean", Boolean(false)),
        ("Byte", Byte(255)),
        ("String", String("!")),
      |]),
      Map.String.fromArray([|
        ("Number", Number(1.3)),
        ("Boolean", Boolean(false)),
        ("Byte", Byte(255)),
        ("String", String({|Some "quoted" string|})),
      |]),
    ];
    expect(TabData.parse(tsv)) |> toEqual(expected);
  });
});
