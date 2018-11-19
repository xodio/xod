/** Tabular test data parsing facilities. The tabular data is basically a TSV
    file, but stricter:

    - Header line is required
    - Data is strongly typed, so strings must be enquoted

    Empty lines are allowed and ignored.
 */
open Belt;

/** Corresponds to a single cell in the TSV */
module Value: {
  type t =
    | Empty
    | NaN
    | Number(float)
    | ApproxNumber(float, int)
    | Boolean(bool)
    | String(string)
    | Byte(int)
    | Pulse(bool)
    | Invalid(string);
};

/** Corresponds to a single data line in the TSV */
module Record: {
  type t = Map.String.t(Value.t);
  let get: (t, string) => option(Value.t);
};

/** Corresponds to the whole TSV */
type t = list(Record.t);

/** Maps all records in data like regular lists do */
let map: (t, Record.t => 'v) => List.t('v);

/** Maps all records in data with indexes like regular lists do */
let mapWithIndex: (t, (int, Record.t) => 'v) => List.t('v);

/** Parses a plain source (as read from file) into tabular data.

    Note, the parsing always succeeds leaving `Value.Invalid` for
    the cells which failed to parse. It’s up to a consumer to handle
    the data errors. */
let parse: string => t;
