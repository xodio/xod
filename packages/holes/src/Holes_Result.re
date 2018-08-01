type t('good, 'bad) = Belt.Result.t('good, 'bad);

let map = (res: t('goodA, 'bad), fn: 'goodA => 'goodB) : t('goodB, 'bad) =>
  switch (res) {
  | Ok(good) => Ok(fn(good))
  | Error(bad) => Error(bad)
  };

let flatMap =
    (res: t('goodA, 'bad), fn: 'goodA => t('goodB, 'bad))
    : t('goodB, 'bad) =>
  switch (res |. map(fn)) {
  | Ok(Ok(good)) => Ok(good)
  | Ok(Error(bad)) => Error(bad)
  | Error(bad) => Error(bad)
  };

let liftM2 =
    (
      fn: ('goodA, 'goodB) => t('goodR, 'bad),
      a: t('goodA, 'bad),
      b: t('goodB, 'bad),
    )
    : t('goodR, 'bad) =>
  switch (a, b) {
  | (Ok(goodA), Ok(goodB)) => fn(goodA, goodB)
  | (Error(bad), _)
  | (_, Error(bad)) => Error(bad)
  };

let liftM3 =
    (
      fn: ('goodA, 'goodB, 'goodC) => t('goodR, 'bad),
      a: t('goodA, 'bad),
      b: t('goodB, 'bad),
      c: t('goodC, 'bad),
    )
    : t('goodR, 'bad) =>
  switch (a, b, c) {
  | (Ok(goodA), Ok(goodB), Ok(goodC)) => fn(goodA, goodB, goodC)
  | (Error(bad), _, _)
  | (_, Error(bad), _)
  | (_, _, Error(bad)) => Error(bad)
  };

let lift2 =
    (fn: ('goodA, 'goodB) => 'goodR, a: t('goodA, 'bad), b: t('goodB, 'bad))
    : t('goodR, 'bad) =>
  liftM2((goodA, goodB) => Ok(fn(goodA, goodB)), a, b);

let lift3 =
    (
      fn: ('goodA, 'goodB, 'goodC) => 'goodR,
      a: t('goodA, 'bad),
      b: t('goodB, 'bad),
      c: t('goodC, 'bad),
    )
    : t('goodR, 'bad) =>
  liftM3((goodA, goodB, goodC) => Ok(fn(goodA, goodB, goodC)), a, b, c);
