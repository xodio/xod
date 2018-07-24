type t('a) = Js.Types.obj_val;

[@bs.module ".."]
external foldMaybe : ('b, 'a => 'b, t('a)) => 'b = "";

let toOption = maybe =>
  maybe |> foldMaybe(None, justValue => Some(justValue));
