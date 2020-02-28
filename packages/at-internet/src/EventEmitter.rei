type t;

let create: unit => t;

let emit: (t, string, string) => bool;

let on: (t, string, 'a => unit) => t;
