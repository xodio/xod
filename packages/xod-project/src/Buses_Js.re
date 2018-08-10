let jumperizePatchRecursivelyU: (Patch.path, Project.t) => Project.t =
  (patchPath, project) =>
    Buses.jumperizePatchRecursively(project, patchPath);

let splitLinksToBusesU:
  ((Node.t, Pin.t) => Position.t, Patch.path, array(Link.id), Project.t) =>
  Project.t =
  (getBusPosition, patchPath, linkIds, project) =>
    Buses.splitLinksToBuses(
      getBusPosition,
      patchPath,
      Belt.List.fromArray(linkIds),
      project,
    );
