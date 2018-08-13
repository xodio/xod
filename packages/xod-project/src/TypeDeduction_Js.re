let deducePinTypes: (Patch.t, Project.t) => TypeDeduction.ResultsMap.t_Js =
  (patch, project) =>
    patch
    |. TypeDeduction.deducePinTypes(project)
    |. TypeDeduction.ResultsMap.toJsDict;
