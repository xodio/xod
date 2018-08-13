open Belt;

open XodFuncTools;

let generatePatchSuite = (project, patchPath) =>
  Tabtest.generatePatchSuite(project, patchPath)
  |. Holes.Result.map(files => files |. Map.String.toList |. Js.Dict.fromList)
  |. Either.fromResult;

let generateProjectSuite = project =>
  Tabtest.generateProjectSuite(project)
  |. Holes.Result.map(files => files |. Map.String.toList |. Js.Dict.fromList)
  |. Either.fromResult;
