open Belt;

let groupByString = (values, getKey) =>
  List.reduceReverse(values, Map.String.empty, (accMap, nextVal) =>
    Map.String.update(accMap, getKey(nextVal), existingVals =>
      switch (existingVals) {
      | Some(vs) => Some([nextVal, ...vs])
      | None => Some([nextVal])
      }
    )
  );
