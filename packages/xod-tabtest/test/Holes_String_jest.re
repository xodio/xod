open Jest;

open Expect;

open Holes.String;

describe("join", () => {
  test("returns empty for empty", () =>
    expect([] |. join(", ")) |> toEqual("")
  );
  test("returns identity for a single string", () =>
    expect(["Hello"] |. join(", ")) |> toEqual("Hello")
  );
  test("inserts delimiter between pairs", () =>
    expect(["Hello", "wonderful", "world"] |. join(", "))
    |> toEqual("Hello, wonderful, world")
  );
});

describe("indent", () => {
  test("indents empty", () =>
    expect("" |. indent(2)) |> toEqual("  ")
  );
  test("indents at line breaks", () =>
    expect("foo();\nbar();" |. indent(2))
    |> toEqual("  foo();\n" ++ "  bar();")
  );
});

describe("reverse", () => {
  test("returns empty for empty", () =>
    expect(reverse("")) |> toEqual("")
  );
  test("indeed reverses", () =>
    expect(reverse("Hello")) |> toEqual("olleH")
  );
});
