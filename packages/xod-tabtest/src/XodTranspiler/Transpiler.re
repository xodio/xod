open Belt;

module TProject = {
  type t;
};

type program = {
  code: string,
  nodeIdMap: Map.String.t(string),
};

[@bs.module "xod-arduino"]
external _transformProject :
  (Project.t, string) => Either.t(Js.Exn.t, TProject.t) =
  "transformProject";

[@bs.module "xod-arduino"]
external _transpile : TProject.t => string = "transpile";

[@bs.module "xod-arduino"]
external _getNodeIdsMap : TProject.t => Js.Dict.t(string) = "getNodeIdsMap";

let transpile = (project, patchPath) : XResult.t(program) =>
  _transformProject(project, patchPath)
  |. Either.toResult
  |. Holes.Result.map(tProject =>
       {
         code: _transpile(tProject),
         nodeIdMap:
           _getNodeIdsMap(tProject) |> Js.Dict.entries |> Map.String.fromArray,
       }
     );
