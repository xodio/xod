type t;

type id = string;

let create:
  (~toPin: Pin.key, ~toNode: Node.id, ~fromPin: Pin.key, ~fromNode: Node.id) =>
  t;

let getId: t => id;

let getInputNodeId: t => Node.id;

let getOutputNodeId: t => Node.id;

let getInputPinKey: t => Pin.key;

let getOutputPinKey: t => Pin.key;

let setInputPinKey: (Pin.key, t) => t;

let setOutputPinKey: (Pin.key, t) => t;

let inputNodeIdEquals: (Node.id, t) => bool;

let outputNodeIdEquals: (Node.id, t) => bool;

let inputPinKeyEquals: (Pin.key, t) => bool;

let outputPinKeyEquals: (Pin.key, t) => bool;
