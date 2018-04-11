open Belt;

type key = string;

type t = {
  .
  "key": key,
  "direction": string,
  "label": string,
  "_type": string,
  "defaultValue": string,
  "order": int,
  "description": string,
  "isBindable": bool,
};

type dataType =
  | Pulse
  | Boolean
  | Number
  | String;

type direction =
  | Input
  | Output;

let getDirection = (pin: t) : direction => {
  let dir = pin##direction;
  switch (dir) {
  | "input" => Input
  | "output" => Output
  | _ =>
    Js.Exn.raiseTypeError(
      {j|Pin direction should be "input" or "output", got "$dir"|j},
    )
  };
};

[@bs.module "xod-project"]
external _normalizeLabels : array(t) => array(t) = "normalizePinLabels";

let normalizeLabels = pins =>
  pins |. List.toArray |. _normalizeLabels |. List.fromArray;

let getKey = pin => pin##key;

let getType = (pin: t) : dataType => {
  let tp = pin##_type;
  switch (tp) {
  | "pulse" => Pulse
  | "boolean" => Boolean
  | "number" => Number
  | "string" => String
  | _ =>
    Js.Exn.raiseTypeError(
      {j|Pin type should be "pulse", "boolean", "number", etc, got "$tp"|j},
    )
  };
};

let getLabel = pin => pin##label;
