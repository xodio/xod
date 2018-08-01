/** A type represented by Maybe from ramda-fantasy in JS. Used only for
    interoping between Reason and JS. */
type t('a) = Js.Types.obj_val;

let toOption: t('a) => option('a);
