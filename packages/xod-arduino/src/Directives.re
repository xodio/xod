open Belt;

type code = string;

module Endis = {
  type t =
    | Enable
    | Disable
    | Auto;
  let toBoolean = (hint, default) =>
    switch (hint) {
    | Enable => true
    | Disable => false
    | Auto => default
    };
  let fromString = tok =>
    switch (tok) {
    | "enable" => Enable
    | "disable" => Disable
    | _ => Auto
    };
};

module Pragma = {
  type t = list(string);
  let filterPragmasByFeature = (pragmas: list(t), feature) =>
    pragmas
    |. List.keep(pragma =>
         switch (pragma) {
         | [] => false
         | [feat, ..._] => feat == feature
         }
       );
};

module Re = {
  let replace = (~flags="gm", str, regex, sub) =>
    Js.String.replaceByRe(
      Js.Re.fromStringWithFlags(regex, ~flags),
      sub,
      str,
    );
  let remove = (~flags="gm", str, regex) => replace(~flags, str, regex, "");
  let test = (~flags="gm", str, regex) =>
    Js.Re.test(str, Js.Re.fromStringWithFlags(regex, ~flags));
  let matches = (~flags="gm", str, regex) => {
    let reObj = Js.Re.fromStringWithFlags(regex, ~flags);
    /* Extracts the current match, ignoring capturing groups.
       Assumption: 0-th always exists and refers to the full match */
    let fullMatch = execResult =>
      execResult
      |. Js.Re.captures
      |. Array.getExn(0)
      |. Js.Nullable.toOption
      |. Option.getExn;
    let rec captureNext = () : list(string) =>
      switch (Js.Re.exec(str, reObj)) {
      | None => []
      | Some(result) => List.add(captureNext(), fullMatch(result))
      };
    captureNext();
  };
};

module Code = {
  /*
    Regexp from here: https://regex101.com/r/qY4xD3/15
    Found a link here: https://stackoverflow.com/questions/36454069/how-to-remove-c-style-comments-from-code
    Edited: removed one `\n` in the second non-capturing group to avoid removing new lines
   */
  let allCommentsRegexp = {|(?:\/\/(?:\\\n|[^\n])*)|(?:\/\*[\s\S]*?\*\/)|((?:"([^(\\\s])\([^)]*\)\2")|(?:@"[^"]*?")|(?:"(?:\?\?'|\\\\|\\"|\\\n|[^"])*?")|(?:'(?:\\\\|\\'|\\\n|[^'])*?'))|};
  let trimRegexp = {|\s*$|};
  let stripCppComments = code =>
    code |. Re.replace(allCommentsRegexp, "$1") |. Re.remove(trimRegexp);
  let doesReferSymbol = (symbol, code) =>
    code |. stripCppComments |. Re.test("\\b" ++ symbol ++ "\\b");
  let doesReferTemplateSymbol = (symbol, templateArg, code) =>
    code
    |. stripCppComments
    |. Re.test("\\b" ++ symbol ++ "\\s*\\<\\s*" ++ templateArg ++ "\\s*\\>");
  let pragmaHeadRegexp = {|#\s*pragma\s+XOD\s+|};
  let pragmaLineRegexp = pragmaHeadRegexp ++ ".*";
  let identifierOrStringRegexp = {foo|[\w._-]+|".*?"|foo};
  let enclosingQuotesRegexp = {|^"|"$|};
  let isOutput = identifier => Re.test(identifier, {|^output_|});
  let tokenizePragma = (pragmaLine: string) : Pragma.t =>
    pragmaLine
    |. Re.remove(pragmaHeadRegexp)
    |. Re.matches(identifierOrStringRegexp)
    |. List.map(token => Re.remove(token, enclosingQuotesRegexp));
  let findXodPragmas = code : list(Pragma.t) =>
    code
    |. stripCppComments
    |. Re.matches(pragmaLineRegexp)
    |. List.map(tokenizePragma);
  /*
      Returns whether a particular #pragma feature enabled, disabled, or set to auto.
      Default is auto
   */
  let lastPragmaEndis = (code, feature) : Endis.t =>
    code
    |. findXodPragmas
    |. Pragma.filterPragmasByFeature(feature)
    |. List.reverse
    |. List.head
    |. (
      lastPragma =>
        switch (lastPragma) {
        | Some([_, x, ..._]) => Endis.fromString(x)
        | _ => Endis.Auto
        }
    );
};

let areTimeoutsEnabled = code =>
  code
  |. Code.lastPragmaEndis("timeouts")
  |. Endis.toBoolean(Code.doesReferSymbol("setTimeout", code));

let isNodeIdEnabled = code =>
  code
  |. Code.lastPragmaEndis("nodeid")
  |. Endis.toBoolean(Code.doesReferSymbol("getNodeId", code));

let isDirtienessEnabled = (code, identifier) =>
  code
  |. Code.findXodPragmas
  |. List.reduce(
       Code.isOutput(identifier)  /* dirtieness enabled on outputs by default */
       || Code.doesReferTemplateSymbol("isInputDirty", identifier, code),
       (acc, pragma) =>
       switch (pragma) {
       | ["dirtieness", hintTok] =>
         Endis.toBoolean(Endis.fromString(hintTok), acc)
       | ["dirtieness", hintTok, ident] when ident == identifier =>
         Endis.toBoolean(Endis.fromString(hintTok), acc)
       | _ => acc
       }
     );

let findXodPragmas = Code.findXodPragmas;

let stripCppComments = Code.stripCppComments;
