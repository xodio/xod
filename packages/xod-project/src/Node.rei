type t;

type id = string;

type label = string;

let create: PatchPath.t => t;

let getId: t => id;

let getType: t => PatchPath.t;

let setType: (PatchPath.t, t) => t;

let getLabel: t => label;

let setLabel: (t, label) => t;

let getPosition: t => Position.t;

let setPosition: (t, Position.t) => t;

let isPinNode: t => bool;
