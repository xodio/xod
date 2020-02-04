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
  Returns if `raiseError` is found in the code.
 */
let doesRaiseErrors: code => bool;

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

/**
  Returns whether a C++ code requires `evaluateTmpl`
  instead of the regular `evaluate`. Prefers an explicit
  declaration

    #pragma XOD evaluate_tmpl enable

  If no pragma found, looks for `evaluateTmpl` symbol in the code and returns true
  if it is found.
 */
let implementsEvaluateTmpl: code => bool;

/**
  Returns if a node declares that it needs values
  of read-only inputs in the state constructor using

    #pragma XOD state_constructor_params enable

  Defaults to false.
 */
let wantsStateConstructorWithParams: code => bool;

/**
  Returns wether node declares itself as an error catcher
 */
let doesCatchErrors: code => bool;

/** Returns a list of found XOD pragmas in the order of occurence */
let findXodPragmas: code => list(Pragma.t);

type evaluateOnPinSettings = {
  enabled: bool,
  exceptions: Belt.Set.String.t
};

/**
  Returns a record describing if evaluation on pin dirtyness is enabled
  and possible exceptions.

  For example,

  #pragma XOD evaluate_on_pin disable
  #pragma XOD evaluate_on_pin enable input_UPD input_RST

  would return { enabled: false, exceptions: ['input_UPD', 'input_RST'] }
  because the first pragma disables evaluation on all pins,
  and the second one adds `input_UPD` and `input_RST` as exceptions.
 */
let getEvaluateOnPinSettings: code => evaluateOnPinSettings;

/**
 * Returns a list of strings (URLs) that found in XOD require pragmas:
 *
 *    #pragma XOD require "https://github.com/arduino-libraries/Arduino-IRremote"
 *    #pragma XOD require "https://github.com/arduino-libraries/Stepper"
 */
let findRequireUrls: code => list(string);

/** Removes single- and multiline comments from C++ code */
let stripCppComments: code => code;
