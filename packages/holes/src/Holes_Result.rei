/** Missing functionality for the Result type */
/* Local alias */
type t('good, 'bad) =
  Belt.Result.t('good, 'bad);

/** Monadic map over the result. Given a mapping function which operates
  over regular values (x -> y), lift it up to map from Ok(x) to Ok(y).
  Error passes through as is.

  In another universe might have a name `lift1`. */
let map: (t('goodA, 'bad), 'goodA => 'goodB) => t('goodB, 'bad);

/** Monadic flat map (aka bind and chain) over the result. Given a
  mapping function x -> result(y), lift it to map from Ok(x) to Ok(y)
  in the common case and return Error if the original arg was error
  already or the function has mapped to another Error.

  In another universe might have a name `liftM1`. */
let flatMap:
  (t('goodA, 'bad), 'goodA => t('goodB, 'bad)) => t('goodB, 'bad);

/** Lifts a function over regular argument types to work with monadic arguments.
    Like `map`, but for more arguments. */
let lift2:
  (('goodA, 'goodB) => 'goodR, t('goodA, 'bad), t('goodB, 'bad)) =>
  t('goodR, 'bad);

let lift3:
  (
    ('goodA, 'goodB, 'goodC) => 'goodR,
    t('goodA, 'bad),
    t('goodB, 'bad),
    t('goodC, 'bad)
  ) =>
  t('goodR, 'bad);

/** Lifts a function mapping regular arguments to a result monad to work with
    monadic arguments. Like `flatMap`, but for more arguments. */
let liftM2:
  (('goodA, 'goodB) => t('goodR, 'bad), t('goodA, 'bad), t('goodB, 'bad)) =>
  t('goodR, 'bad);

let liftM3:
  (
    ('goodA, 'goodB, 'goodC) => t('goodR, 'bad),
    t('goodA, 'bad),
    t('goodB, 'bad),
    t('goodC, 'bad)
  ) =>
  t('goodR, 'bad);
