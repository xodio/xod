type t = Js.Types.obj_val;

[@bs.module "xod-project"]
external create :
  (~toPin: Pin.key, ~toNode: Node.id, ~fromPin: Pin.key, ~fromNode: Node.id) =>
  t =
  "createLink";
