type t;

type key = string;

type direction =
  | Input
  | Output;

type dataType =
  | Pulse
  | Boolean
  | Number
  | String;

let getDirection: t => direction;

let normalizeLabels: list(t) => list(t);

let getType: t => dataType;

let getKey: t => key;

let getLabel: t => string;
