export const formatDeadReferencesFound = (patchPath, submessage) =>
  [
    `Patch ${patchPath} contains dead references:`,
    submessage,
    'Fix or delete them to continue.',
  ].join('\n');

export default {};
