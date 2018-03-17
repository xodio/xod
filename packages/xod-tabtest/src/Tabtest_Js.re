open Belt;

let generateSuite = (project, patchPath) =>
  Tabtest.generateSuite(project, patchPath)
  |. Holes.Result.map(files => files |. Map.String.toList |. Js.Dict.fromList)
  |. Either.fromResult;
