/**
  Loads a project from the given list of workspaces and a path to the project
  */
let loadProject:
  (list(string), string) => Js.Promise.t(XodProject.Project.t);
