open Belt;

type t = string;

let join = (xs, delimiter) => {
  let reduce = (xs, delimiter) =>
    List.reduce(xs, ("", ""), ((acc, delimiter'), s) =>
      (acc ++ delimiter' ++ s, delimiter)
    );
  let (str, _) = reduce(xs, delimiter);
  str;
};

let joinLines = join(_, "\n");

let indent = (str, n) =>
  Js.String.replaceByRe([%bs.re "/^/gm"], Js.String.repeat(n, " "), str);

let reverse = str =>
  Js.String.split("", str) |. Array.reverse |. List.fromArray |. join("");
