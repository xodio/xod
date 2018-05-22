open Belt;

type t = Js.Types.obj_val;

[@bs.module "xod-project"]
external _listPatches : t => array(Patch.t) = "listPatches";

let listPatches = project => _listPatches(project) |. List.fromArray;

[@bs.module "xod-project"]
external _listLocalPatches : t => array(Patch.t) = "listLocalPatches";

let listLocalPatches = project => _listLocalPatches(project) |. List.fromArray;

[@bs.module "xod-project"]
external _assocPatch : (PatchPath.t, Patch.t, t) => Either.t(Js.Exn.t, t) =
  "assocPatch";

let assocPatch = (project, path, patch) =>
  _assocPatch(path, patch, project) |. Either.toResult;

[@bs.module "xod-project"]
external _getPatchByPath : (PatchPath.t, t) => Maybe.t(Patch.t) =
  "getPatchByPath";

let getPatchByPath = (project, path) =>
  _getPatchByPath(path, project) |. Maybe.toOption;

let getPatchByNode = (project, node) =>
  getPatchByPath(project, Node.getType(node));
