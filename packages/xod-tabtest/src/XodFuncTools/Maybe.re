type t('a) = Js.Types.obj_val;

[@bs.module "xod-func-tools"]
external foldMaybe : ('b, 'a => 'b, t('a)) => 'b = "";

let toOption = maybe =>
  maybe |> foldMaybe(None, justValue => Some(justValue));
