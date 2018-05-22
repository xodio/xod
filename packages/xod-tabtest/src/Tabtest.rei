open Belt;

/** 'Filename -> Content' map of all C++ files comprising the test suite.
     The catch.hpp and Arduino.* stubs are omitted here and should be
     additionally added by a consumer or made available with a -Include path
     g++ switch. */
type t = Map.String.t(string);

/** Returns a test suite for the given patch of a project */
let generatePatchSuite: (Project.t, Patch.path) => XResult.t(t);

/** Returns a test suite for all patches with tabtests in the given project */
let generateProjectSuite: Project.t => XResult.t(t);
