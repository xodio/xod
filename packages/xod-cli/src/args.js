// fake entrypoint argument just for --help
// use with command's property strict == false
export const entrypoint = {
  name: 'entrypoint',
  required: false,
  hidden: false,
  description:
    `Project and/or patch to operate on. The project should point to a file or\n` +
    `directory on the file system. The patch may either point to file system or\n` +
    `be a XOD patch path. If either is omitted, it is inferred from the current\n` +
    `working directory or another argument. Examples:\n\n` +
    `  * ./path/to/proj.xodball main      # xodball + patch name\n` +
    `  * ./path/to/proj/main/patch.xodp   # just full path to a patch\n` +
    `  * main                             # a patch in the current project`,
};

// fake project argument just for --help
export const project = {
  name: 'project',
  required: false,
  hidden: false,
  description:
    `Project to operate on. The project should point to a file or directory\n` +
    `on file system. If omitted, it is inferred from the current working\n` +
    `directory. Examples:\n\n` +
    `  * ./path/to/proj.xodball           # xodball\n` +
    `  * ./path/to/proj                   # just full path to a project`,
};
