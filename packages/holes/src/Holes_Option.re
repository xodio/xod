
let getWithLazyDefault: (option('a), unit => 'a) => 'a =
  (opt, getDefault) =>
    switch (opt) {
    | Some(x) => x
    | None => getDefault()
    };
