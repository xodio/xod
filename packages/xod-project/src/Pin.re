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

type primitiveDataType =
  | Pulse
  | Boolean
  | Number
  | Byte
  | String;

type dataType = string;

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

let isOutput = (pin: t) : bool => pin |. getDirection |. dir => (dir === Output);

let isInput = (pin: t) : bool => pin |. getDirection |. dir => (dir === Input);

[@bs.module ".."]
external _normalizeLabels : array(t) => array(t) = "normalizeEmptyPinLabels";

let normalizeLabels = pins =>
  pins |. List.toArray |. _normalizeLabels |. List.fromArray;

let getKey = pin => pin##key;

let getPrimitiveTypeExn = (pin: t) : primitiveDataType => {
  let tp = pin##_type;
  switch (tp) {
  | "pulse" => Pulse
  | "boolean" => Boolean
  | "number" => Number
  | "byte" => Byte
  | "string" => String
  | _ =>
    Js.Exn.raiseTypeError(
      {j|Pin type should be "pulse", "boolean", "number", etc, got "$tp"|j},
    )
  };
};

let getLabel = pin => pin##label;
