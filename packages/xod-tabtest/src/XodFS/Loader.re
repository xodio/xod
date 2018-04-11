open Belt;

module FFI = {
  [@bs.module "xod-fs"]
  external loadProject : (array(string), string) => Js.Promise.t(Project.t) =
    "loadProject";
};

let loadProject = (workspaces, patchPath) =>
  FFI.loadProject(List.toArray(workspaces), patchPath);
