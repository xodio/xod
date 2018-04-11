/** Functions for strings manipulation */
type t = string;

/** Joins multiple strings together placing a delimiter between each pair. */
let join: (list(t), t) => t;

/** Joins multiple strings with <LF>. In other words, joins multiple lines into
    a single multiline string. */
let joinLines: list(t) => t;

/** Indents all lines in a multiline string with a specified number of
    spaces. */
let indent: (t, int) => t;

/** Writes the string backward */
let reverse: t => t;
