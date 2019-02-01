export const PATCH_FOR_NODE_IS_MISSING = 'Patch for this node is missing.';

export const libInstalled = (libName, version) => ({
  title: `Installed successfully`,
  note: `${libName} version ${version} is now available in your project browser.`,
});

export const CLIPBOARD_RECURSION_PASTE_ERROR = {
  title: 'Cannot paste recursively',
  note:
    'You’re trying to add a node into its own implementation. That’s forbidden.',
  persistent: false,
};
export const clipboardMissingPatchPasteError = missingPatches => ({
  title: 'Invalid paste',
  note: `The clipboard contains references to missing patches: ${missingPatches}.`,
  solution:
    'First, bring the referred local patches, custom type patches, ' +
    'and third-party libraries to the project.',
});

export const LIB_SUGGESTER_TYPE_TO_BEGIN =
  'Type owner/libname to find a library';

export const LIB_SUGGESTER_NOTHING_FOUND = 'No library found';

export const NO_PATCH_TO_TRANSPILE = {
  title: 'No patch opened',
  solution: 'Open a patch to upload and try again',
  persistent: false,
};

export const SIMULATION_ALREADY_RUNNING = {
  title: 'Simulation already running',
  solution: 'Stop the current simulation and try again',
  persistent: true,
};
