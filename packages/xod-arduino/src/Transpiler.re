open Belt;
open XodFuncTools;
open XodProject;

module TProject = {
  type t;
};

type program = {
  code: string,
  nodeIdMap: Map.String.t(string),
};

[@bs.module ".."]
external _transformProject :
  (Project.t, string) => Either.t(Js.Exn.t, TProject.t) =
  "transformProject";

[@bs.module ".."]
external _transpile : TProject.t => string = "transpile";

[@bs.module ".."]
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
