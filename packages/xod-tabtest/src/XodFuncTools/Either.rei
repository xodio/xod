/** A type represented by Either from ramda-fantasy in JS. Used only for
    interoping between Reason and JS. */
type t('left, 'right);

let toResult: t('left, 'right) => Js.Result.t('right, 'left);

let fromResult: Js.Result.t('right, 'left) => t('left, 'right);
