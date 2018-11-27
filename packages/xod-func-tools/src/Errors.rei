/**
 * Returns a JS Error with added `type` and `payload` properties.
 * Accepts:
 * - type (string)
 * - payload (record)
 */
let createError: (string, 'a) => Js.Exn.t;
