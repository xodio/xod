type t;

type key = string;

type direction =
  | Input
  | Output;

type primitiveDataType =
  | Pulse
  | Boolean
  | Number
  | Byte
  | String;

/* TODO: "upgrade" to variant?
  something like
   | Primitive(primitiveDataType)
   | Custom(string)
   | Generic(genericType)
   | Dead
*/
type dataType = string;

let getDirection: t => direction;

let normalizeLabels: list(t) => list(t);

let getPrimitiveTypeExn: t => primitiveDataType;

let getKey: t => key;

let getLabel: t => string;
