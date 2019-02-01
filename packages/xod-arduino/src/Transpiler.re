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

type liveness =
  | None
  | Debug
  | Simulation;

[@bs.module ".."]
external _transformProject :
  (Project.t, string, string) => Either.t(Js.Exn.t, TProject.t) =
  "transformProject";

[@bs.module ".."] external _transpile : TProject.t => string = "transpile";

[@bs.module ".."]
external _getNodeIdsMap : TProject.t => Js.Dict.t(string) = "getNodeIdsMap";

let getLivenessString = liveness =>
  switch (liveness) {
    | None => "NONE"
    | Debug => "DEBUG"
    | Simulation => "SIMULATION"
  };

let transpile = (project, patchPath, liveness) : XResult.t(program) =>
  _transformProject(project, patchPath, getLivenessString(liveness))
  |. Either.toResult
  |. BeltHoles.Result.map(tProject =>
       {
         code: _transpile(tProject),
         nodeIdMap:
           _getNodeIdsMap(tProject) |> Js.Dict.entries |> Map.String.fromArray,
       }
     );
