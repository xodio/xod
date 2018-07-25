/** A type represented by Either from ramda-fantasy in JS. Used only for
    interoping between Reason and JS. */
type t('left, 'right);

let toResult: t('left, 'right) => Belt.Result.t('right, 'left);

let fromResult: Belt.Result.t('right, 'left) => t('left, 'right);
