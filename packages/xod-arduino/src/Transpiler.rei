open Belt;

open XodFuncTools;

open XodProject;

type program = {
  code: string,
  nodeIdMap: Map.String.t(string),
};

/**
 * Liveness describes how to transpile code:
 * - "NONE" — default for upload (stripping debug nodes)
 * - "DEBUG" — without stripping debug nodes and turns "XOD_DEBUG" on
 * - "SIMULATION" — without stripping debug nodes and turns "XOD_SIMULATION" on
 */
type liveness =
  | None
  | Debug
  | Simulation;

let transpile: (Project.t, PatchPath.t, liveness) => XResult.t(program);
