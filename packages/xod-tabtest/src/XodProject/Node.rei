type t;

type id = string;

let create: PatchPath.t => t;

let getId: t => id;

let getType: t => PatchPath.t;
