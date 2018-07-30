type t = Js.Types.obj_val;

type id = string;

[@bs.module ".."]
external create :
  (~toPin: Pin.key, ~toNode: Node.id, ~fromPin: Pin.key, ~fromNode: Node.id) =>
  t =
  "createLink";

[@bs.module ".."] external getId : t => id = "getLinkId";

[@bs.module ".."]
external getInputNodeId : t => Node.id = "getLinkInputNodeId";

[@bs.module ".."]
external getOutputNodeId : t => Node.id = "getLinkOutputNodeId";

[@bs.module ".."]
external getInputPinKey : t => Pin.key = "getLinkInputPinKey";

[@bs.module ".."]
external getOutputPinKey : t => Pin.key = "getLinkOutputPinKey";

[@bs.module ".."]
external setInputPinKey : (Pin.key, t) => t = "setLinkInputPinKey";

[@bs.module ".."]
external setOutputPinKey : (Pin.key, t) => t = "setLinkOutputPinKey";

[@bs.module ".."]
external inputNodeIdEquals : (Node.id, t) => bool = "isLinkInputNodeIdEquals";

[@bs.module ".."]
external outputNodeIdEquals : (Node.id, t) => bool =
  "isLinkOutputNodeIdEquals";

[@bs.module ".."]
external inputPinKeyEquals : (Pin.key, t) => bool = "isLinkInputPinKeyEquals";

[@bs.module ".."]
external outputPinKeyEquals : (Pin.key, t) => bool =
  "isLinkOutputPinKeyEquals";
