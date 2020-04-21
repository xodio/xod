// A wrapper over the standard module `EventEmitter` from NodeJs

type t;

// Creates an EventEmitter
let create: unit => t;

// Emits an event with some payload
let emit: (t, string, string) => bool;

// Subscribe on the event
let on: (t, string, 'a => unit) => t;
