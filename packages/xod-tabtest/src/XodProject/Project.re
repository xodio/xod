type t = Js.Types.obj_val;

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
