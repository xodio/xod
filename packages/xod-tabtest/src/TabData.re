open Belt;

module Re = Js.Re;

module Value = {
  type t =
    | Empty
    | NaN
    | Number(float)
    | Boolean(bool)
    | String(string)
    | Byte(int)
    | Invalid(string);
  let numberRegex = [%re {|/^[+-]?(?=.)*\d*(?:\.\d+)?$/|}];
  let stringRegex = [%re {|/^".*"$/|}];
  let byteRegex = [%re {|/^[0-9a-f]{2}h|[0,1]{8}b|\d{1,3}d$/i|}];
  let unquote = str =>
    str
    |> Js.String.replaceByRe([%re "/^\"/"], "")
    |> Js.String.replaceByRe([%re "/\"$/"], "");
  let init = (str: string) : string =>
    String.sub(str, 0, String.length(str) - 1);
  let byteStringToInt = str =>
    switch (str) {
    | bin when Re.test(bin, [%re {|/b$/|}]) =>
      "0b" ++ init(bin) |. int_of_string |. (x => Byte(x))
    | hex when Re.test(hex, [%re {|/h$/|}]) =>
      "0x" ++ init(hex) |. int_of_string |. (x => Byte(x))
    | dec when Re.test(dec, [%re {|/d$/|}]) =>
      init(dec) |. int_of_string |. (x => Byte(x))
    | x => Invalid(x)
    };
  let parse = str =>
    switch (str) {
    | "" => Empty
    | "true" => Boolean(true)
    | "false" => Boolean(false)
    | "NaN" => NaN
    | numString when Re.test(numString, numberRegex) =>
      Number(Js.Float.fromString(numString))
    | quotedString when Re.test(quotedString, stringRegex) =>
      String(unquote(quotedString))
    | byteString when Re.test(byteString, byteRegex) =>
      byteStringToInt(byteString)
    | x => Invalid(x)
    };
};

module Record = {
  type t = Map.String.t(Value.t);
  let fromPairs = (pairs: list((string, Value.t))) : t =>
    pairs |. List.toArray |. Map.String.fromArray;
  let get = (t, column) =>
    Map.String.get(t, column)
    |. Option.flatMap(value =>
         switch (value) {
         | Value.Empty => None
         | x => Some(x)
         }
       );
};

type t = list(Record.t);

let map = List.map;

let tabSplit = x =>
  Js.String.split("\t", x) |. List.fromArray |. List.map(Js.String.trim);

let parse = (tsvSource: string) : t =>
  tsvSource
  |> Js.String.split("\n")
  |> List.fromArray
  |> (
    lines =>
      switch (List.head(lines)) {
      | None => []
      | Some(firstLine) =>
        let header = tabSplit(firstLine);
        let lineToRecord = (line: string) : Record.t =>
          tabSplit(line)
          |. List.map(Value.parse)
          |. List.zip(header, _)
          |. Record.fromPairs;
        List.tailExn(lines)
        |. List.keep(x => x != "")
        |. List.map(lineToRecord);
      }
  );
