type t;

let listPatches: t => list(Patch.t);

let listLocalPatches: t => list(Patch.t);

let assocPatch: (t, PatchPath.t, Patch.t) => XResult.t(t);

let getPatchByPath: (t, PatchPath.t) => option(Patch.t);

let getPatchByNode: (t, Node.t) => option(Patch.t);
