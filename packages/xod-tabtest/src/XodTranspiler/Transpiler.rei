open Belt;

type program = {
  code: string,
  nodeIdMap: Map.String.t(string),
};

let transpile: (Project.t, PatchPath.t) => XResult.t(program);
