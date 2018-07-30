open Belt;
open XodFuncTools;

type t = Js.Types.obj_val;

[@bs.module ".."] external _listPatches : t => array(Patch.t) = "listPatches";

let listPatches = project => _listPatches(project) |. List.fromArray;

[@bs.module ".."]
external _listLocalPatches : t => array(Patch.t) = "listLocalPatches";

let listLocalPatches = project =>
  _listLocalPatches(project) |. List.fromArray;

[@bs.module ".."]
external _assocPatch : (PatchPath.t, Patch.t, t) => Either.t(Js.Exn.t, t) =
  "assocPatch";

let assocPatch = (project, path, patch) =>
  _assocPatch(path, patch, project) |. Either.toResult;

[@bs.module ".."]
external _getPatchByPath : (PatchPath.t, t) => Maybe.t(Patch.t) =
  "getPatchByPath";

let getPatchByPath = (project, path) =>
  _getPatchByPath(path, project) |. Maybe.toOption;

let getPatchByNode = (project, node) =>
  getPatchByPath(project, Node.getType(node));

[@bs.module ".."]
external _getPatchDependencies : (Patch.path, t) => array(Patch.path) =
  "getPatchDependencies";

let getPatchDependencies = (project, patchPath) =>
  _getPatchDependencies(patchPath, project) |. Belt.List.fromArray;

[@bs.module ".."]
external _assocPatchListUnsafe : (array(Patch.t), t) => t =
  "assocPatchListUnsafe";

let assocPatchList = (project, patchList) =>
  _assocPatchListUnsafe(Belt.List.toArray(patchList), project);
