open Belt;

open XodFuncTools;

let generatePatchSuite = (project, patchPath) =>
  Tabtest.generatePatchSuite(project, patchPath)
  |. BeltHoles.Result.map(files => files |. Map.String.toList |. Js.Dict.fromList)
  |. Either.fromResult;

let generateProjectSuite = project =>
  Tabtest.generateProjectSuite(project)
  |. BeltHoles.Result.map(files => files |. Map.String.toList |. Js.Dict.fromList)
  |. Either.fromResult;
