open Belt;

/** Splits a list into sub-lists stored in a Map.String,
    based on the result of calling a string-returning function on each element,
    and grouping the results according to values returned. */
let groupBy: (list('a), 'a => string) => Map.String.t(list('a));
