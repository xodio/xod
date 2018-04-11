/** A type for a pattern widely-used in XOD where the result is
    either OK or a JS Error */
type t('good) = Js.Result.t('good, Js.Exn.t);
