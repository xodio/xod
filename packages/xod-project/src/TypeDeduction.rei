open Belt;

module ResultsMap: {
  /** Type deduction result for a single pin.
    Either a single type or an array of conflicting types */
  type result = Result.t(Pin.dataType, Js.Array.t(Pin.dataType));
  /** The "outer" map has Node.id as keys,
      the "inner" map — Pin.key */
  type t = Map.String.t(Map.String.t(result));
  /** Js representation of deduction results */
  type t_Js =
    Js.Dict.t(
      Js.Dict.t(
        XodFuncTools.Either.t(Js.Array.t(Pin.dataType), Pin.dataType),
      ),
    );
  /** convert from Js representation */
  let fromJsDict: t_Js => t;
  /** convert to Js representation */
  let toJsDict: t => t_Js;
  /** get a deduction result for a specified node's pin */
  let get: (t, Node.id, Pin.key) => option(result);
  /** set a deduction result for a specified node's pin */
  let assoc: (t, Node.id, Pin.key, result) => t;
  /** remove a deduction result for a specified node's pin */
  let dissoc: (t, Node.id, Pin.key) => t;
};

/** Deduce types for generic pins in a given patch */
let deducePinTypes: (Patch.t, Project.t) => ResultsMap.t;
