import R from 'ramda';

// :: flat_state -> state_with_history
export const newPatch = ({
  id,
  label = 'New patch',
  folderId = null,
  nodes = {},
  links = {},
}) => ({
  static: {
    id,
    label,
    folderId,
  },
  past: [],
  present: {
    nodes,
    links,
  },
  future: [],
});

// :: state -> boolean
export const isPatchWithHistory = R.allPass([
  R.has('static'),
  R.has('past'),
  R.has('present'),
  R.has('future'),
]);

// :: state -> boolean
export const isPatchWithoutHistory = R.complement(isPatchWithHistory);

// :: action -> patchId -> boolean
export const isActionForThisPatch = R.curry((action, patchId) =>
  (action && action.meta && action.meta.patchId && action.meta.patchId !== patchId));


// :: state -> state.static
export const getStatic = R.prop('static');

// :: state -> [ state.past, state.present, state.future ]
export const getHistory = R.pick(['past', 'present', 'future']);
