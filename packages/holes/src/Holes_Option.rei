
/** `getWithLazyDefault optionalValue getDefault`
    If `optionalValue` is `Some value`, returns `value`, otherwise returns result of `getDefault()` */
let getWithLazyDefault: (option('a), unit => 'a) => 'a;
