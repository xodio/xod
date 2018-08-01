type t = Js.Types.obj_val;

type id = string;

type label = string;

type position = {
  .
  "x": int,
  "y": int,
};

let origin = {"x": 0, "y": 0};

[@bs.module ".."]
external _create : (position, PatchPath.t) => t = "createNode";

let create = patchPath => _create(origin, patchPath);

[@bs.module ".."] external getId : t => id = "getNodeId";

[@bs.module ".."] external getType : t => PatchPath.t = "getNodeType";

[@bs.module ".."] external setType: (PatchPath.t, t) => t = "setNodeType";

[@bs.module ".."] external getLabel: t => label = "getNodeLabel";
