open Belt;

[@bs.deriving abstract]
type invalidPinsErrorPayloadType = {
  missing: array(string),
  redundant: array(string),
  duplicated: array(string),
};

let validatePinLabels =
    (realPinLabels: list(string), testingPinLabels: list(string))
    : option(Js.Exn.t) => {
  /* Create Sets of real and testing pin labels to get difference in optimal way */
  let testingPinLabelsSet =
    testingPinLabels |. List.toArray |. Set.String.fromArray;
  let realPinLabelsSet = realPinLabels |. List.toArray |. Set.String.fromArray;
  let missingPinLabels =
    realPinLabelsSet
    |. Set.String.diff(testingPinLabelsSet)
    |. Set.String.toList;
  let redundantPinLabels =
    testingPinLabelsSet
    |. Set.String.diff(realPinLabelsSet)
    |. Set.String.toList
    |. List.keep((!=)(SpecialColumns.time));
  let duplicatedPinLabels =
    testingPinLabels
    |. List.reduce(
         Map.String.empty,
         (acc, pinLabel) => {
           let pinLabelCount = acc |. Map.String.getWithDefault(pinLabel, 0);
           acc |. Map.String.set(pinLabel, pinLabelCount + 1);
         },
       )
    |. Map.String.keep((_, v) => v > 1)
    |. Map.String.keysToArray
    |. List.fromArray
    |. List.keep(x => ! List.has(redundantPinLabels, x, (==)));
  let errorOccured =
    List.length(missingPinLabels)
    + List.length(redundantPinLabels)
    + List.length(duplicatedPinLabels) > 0;
  if (errorOccured) {
    let payload =
      invalidPinsErrorPayloadType(
        ~missing=missingPinLabels |. List.toArray,
        ~redundant=redundantPinLabels |. List.toArray,
        ~duplicated=duplicatedPinLabels |. List.toArray,
      );
    Some(
      XodFuncTools.Errors.createError(
        "INVALID_PIN_LABELS_IN_TABTEST",
        payload,
      ),
    );
  } else {
    None;
  };
};
