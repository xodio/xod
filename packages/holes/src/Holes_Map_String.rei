/** Missing functionality for Belt.String.Map */
open Belt;

type k = Map.String.key;

type t('v) = Map.String.t('v);

/** Performs value mapping throwing away the values for which the
    mapping function returns None */
let keepMap: (t('v), 'v => option('v2)) => t('v2);

/** The same as `keepMap` but also provides a key of the current item to the mapping functions */
let keepMapWithKey: (t('v), (k, 'v) => option('v2)) => t('v2);

/** Changes keys preserving the associated data.

    If multiple keys map to the same value, one
    of them will be overriden and thus effectively discarded. Which one is not defined.
    However, it is OK to map a key X to Y and Y to X, they will swap correctly. */
let mapKeys: (t('a), k => k) => t('a);

/** Performs SQL-alike join between two maps. Each value of the first map transitively
    mapped to a value defined by the second map lookup. If a key/value is missing from
    either side, the pair will not appear in the result */
let innerJoin: (t(k), t('v)) => t('v);

/** Merges two maps extending the first map with contents of the second. If a key
    presents in both maps, the value of the second map wins. */
let mergeOverride: (t('v), t('v)) => t('v);
