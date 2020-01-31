open Belt;

let isDirtienessEnabled = Directives.isDirtienessEnabled;

let doesCatchErrors = Directives.doesCatchErrors;

let isNodeIdEnabled = Directives.isNodeIdEnabled;

let doesRaiseErrors = Directives.doesRaiseErrors;

let implementsEvaluateTmpl = Directives.implementsEvaluateTmpl;

let wantsStateConstructorWithParams = Directives.wantsStateConstructorWithParams;

let getEvaluateOnPinSettings = code =>
  code |> Directives.getEvaluateOnPinSettings |> ({enabled, exceptions}) => {
    "enabled": enabled,
    "exceptions": Set.String.toArray(exceptions)
  };

let areTimeoutsEnabled = Directives.areTimeoutsEnabled;

let stripCppComments = Directives.stripCppComments;

let findXodPragmas = code =>
  code |. Directives.findXodPragmas |. List.toArray |. Array.map(List.toArray);

let findRequireUrls = code =>
  code |. Directives.findRequireUrls |. List.toArray;
