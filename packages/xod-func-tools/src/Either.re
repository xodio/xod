type t('left, 'right) = Js.Types.obj_val;

[@bs.module ".."]
external foldEither : ('left => 'a, 'right => 'a, t('left, 'right)) => 'a =
  "";

[@bs.module ".."]
external eitherLeft : 'left => t('left, 'right) = "";

[@bs.module ".."]
external eitherRight : 'right => t('left, 'right) = "";

let toResult = either =>
  either
  |> foldEither(left => Js.Result.Error(left), right => Js.Result.Ok(right));

let fromResult = result =>
  switch (result) {
  | Js.Result.Error(left) => eitherLeft(left)
  | Js.Result.Ok(right) => eitherRight(right)
  };
