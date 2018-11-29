/**
 * Checks tabtest for correct pin labels and throws an error if tabtest has:
 * - missing pin labels
 * - redundant pin labels
 * - duplicated pin labels
 *
 * Otherwise do nothing.
 *
 * Accepts two arguments:
 * - List of real pin labels of tested node
 * - List of pin labels specified in tabtest, including special columns like `__time(ms)`
 *
 * Returns Option:
 * - None if valid
 * - Some(Error) if invalid
 */
let validatePinLabels: (list(string), list(string)) => option(Js.Exn.t);
