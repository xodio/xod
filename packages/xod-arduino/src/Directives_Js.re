open Belt;

let isDirtienessEnabled = Directives.isDirtienessEnabled;

let isNodeIdEnabled = Directives.isNodeIdEnabled;

let areTimeoutsEnabled = Directives.areTimeoutsEnabled;

let stripCppComments = Directives.stripCppComments;

let findXodPragmas = code =>
  code |. Directives.findXodPragmas |. List.toArray |. Array.map(List.toArray);

let findRequireUrls = code =>
  code |. Directives.findRequireUrls |. List.toArray;
