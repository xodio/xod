/** C++ code as a plain string */
type code = string;

/** A single parsed #pragma XOD la la la directive */
module Pragma: {
  /** List of tokens excluding leading `#pragma` and `XOD` */
  type t = list(string);
};

/**
  Returns whether a C++ code requires timeouts storage, i.e., does it relate on
  `setTimeout` API. Prefers an explicit declaration:

    #pragma XOD timeouts disable

  If no pragma found, looks for `setTimeout` call in the code and returns true
  if it is found.
 */
let areTimeoutsEnabled: code => bool;

/**
  Returns whether a C++ code requires node ID access. Prefers an explicit
  declaration

    #pragma XOD nodeid enable

  If no pragma found, looks for `getNodeId` call in the code and returns true
  if it is found.
 */
let isNodeIdEnabled: code => bool;

/**
  Returns whether a particular pin requires dirtieness storage. Prefers an
  explicit declaration.

    #pragma XOD dirtieness disable input_FOO

  If pin identifier is omitted, the pragma sets the rule for all pins.

  If the rule for an *output* is not known the dirtieness storage is enabled by
  default.

  If the rule for an *input* is not known the dirtieness storage is enabled if
  `isInputDirty<input_FOO>` is found in the code and disabled otherwise.
 */
let isDirtienessEnabled: (code, string) => bool;

/** Returns a list of found XOD pragmas in the order of occurence */
let findXodPragmas: code => list(Pragma.t);

/**
 * Returns a list of strings (URLs) that found in XOD require pragmas:
 *
 *    #pragma XOD require "https://github.com/arduino-libraries/Arduino-IRremote"
 *    #pragma XOD require "https://github.com/arduino-libraries/Stepper"
 */
let findRequireUrls: code => list(string);

/** Removes single- and multiline comments from C++ code */
let stripCppComments: code => code;
