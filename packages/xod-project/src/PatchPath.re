type t = string;

[@bs.module ".."] external getBaseName : t => string = "getBaseName";

[@bs.module ".."] external isTerminal : t => bool = "isTerminalPatchPath";

[@bs.module ".."] external isJumper : t => bool = "isJumperPatchPath";

[@bs.module ".."] external isBus : t => bool = "isBusPatchPath";
[@bs.module ".."] external isFromBus : t => bool = "isFromBusPatchPath";
[@bs.module ".."] external isToBus : t => bool = "isToBusPatchPath";
