export const PATCH_FOR_NODE_IS_MISSING = 'Patch for this node is missing.';

export const libInstalled = (libName, version) => ({
  title: `${libName} @ ${version} installed successfully`,
});

export const CLIPBOARD_RECURSION_PASTE_ERROR = {
  title: 'Canʼt paste a patch into itself',
  persistent: false,
};
export const clipboardMissingPatchPasteError = missingPatches => ({
  title: 'Canʼt paste',
  note: `Canʼt find following patches: ${missingPatches}`,
});

export const LIB_SUGGESTER_TYPE_TO_BEGIN =
  'Type owner/libname to find a library';
export const LIB_SUGGESTER_NOTHING_FOUND = 'No library found';

export const NO_PATCH_TO_TRANSPILE = {
  title: 'No patch opened',
  solution: 'Open a patch to upload and try again',
  persistent: false,
};
