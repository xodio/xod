import os from 'os';
import * as R from 'ramda';

const addExtensionsIntoFilters = (fileFilter) => {
  const extForName = R.ifElse(
    R.isEmpty,
    R.always('directory'),
    R.concat('.')
  )(fileFilter.extensions[0]);

  return R.assoc(
    'name',
    `${fileFilter.name} (${extForName})`,
    fileFilter
  );
};
const transformDialogFileFilters = filters => R.compose(
  fn => fn(filters),
  R.cond([
    // We have to reverse an array for MacOS, cause it takes a first extension
    // as a required extension to save a file, so if it is `xodball` — we could
    // not save a Multifile Project.
    [R.equals('darwin'), () => R.reverse],
    // On Linux native dialog extensions does not added automatically into name,
    // as it done in Windows. So do it here:
    [R.equals('linux'), () => R.map(addExtensionsIntoFilters)],
    [R.T, () => R.identity],
  ])
)(os.platform());

export const getSaveDialogFileFilters = () => transformDialogFileFilters([
  { name: 'Packed XOD Project', extensions: ['xodball'] },
  { name: 'Multifile XOD Project', extensions: ['', 'xod'] },
]);
export const getOpenDialogFileFilters = () => transformDialogFileFilters([
  { name: 'Packed XOD project', extensions: ['xodball'] },
  { name: 'Multifile XOD project', extensions: ['xod', 'xodp'] },
]);

export const createSaveDialogOptions = (title, defaultPath, buttonLabel) => ({
  title,
  defaultPath,
  buttonLabel,
  properties: ['createDirectory'],
  message: [
    'To save as packed XOD project add ".xodball" extension,',
    'To save as multifile XOD project add no extension',
  ].join('\n'),
  filters: getSaveDialogFileFilters(),
});
