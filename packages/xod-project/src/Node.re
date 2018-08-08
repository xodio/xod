type t = Js.Types.obj_val;

type id = string;

type label = string;

[@bs.module ".."]
external _create : (Position.t, PatchPath.t) => t = "createNode";

let create = patchPath => _create(Position.origin, patchPath);

[@bs.module ".."] external getId : t => id = "getNodeId";

[@bs.module ".."] external getType : t => PatchPath.t = "getNodeType";

[@bs.module ".."] external setType: (PatchPath.t, t) => t = "setNodeType";

[@bs.module ".."] external getLabel: t => label = "getNodeLabel";
