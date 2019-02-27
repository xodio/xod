import R from 'ramda';

import { def } from '../types';
import { isTerminalPatchPath } from '../internal/patchPathUtils';

import BUILT_IN_PATCHES from '../../dist/built-in-patches.json';

/* eslint-enable new-cap */
//-----------------------------------------------------------------------------
//
// Constants
//
//-----------------------------------------------------------------------------

// Grid until XOD v0.27.0
const LEGACY_SLOT_GRID = {
  WIDTH: 34,
  HEIGHT: 102,
  GAP: 51,
};

// Grid introduced in v0.28.0
// We should know new grid size to migrate Node/Comment sizes correctly
const NEXT_SLOT_GRID = {
  WIDTH: 44,
  HEIGHT: 105,
};

const ROUNDING_ERROR = 20; // 5%

//-----------------------------------------------------------------------------
//
// Getters / Setters
//
//-----------------------------------------------------------------------------

const hasUnits = R.has('units');

const isGenuinePatch = R.compose(
  R.not,
  R.anyPass([
    patchPath => R.has(patchPath, BUILT_IN_PATCHES),
    isTerminalPatchPath,
  ]),
  R.prop('path')
);

const overGenuinePatches = R.curry((converterFn, proj) =>
  R.over(
    R.lensProp('patches'),
    R.map(R.when(isGenuinePatch, converterFn)),
    proj
  )
);

const overNodes = R.curry((converterFn, patch) =>
  R.over(R.lensProp('nodes'), R.map(converterFn), patch)
);

const overComments = R.curry((converterFn, patch) =>
  R.over(R.lensProp('comments'), R.map(converterFn), patch)
);

const overPosition = R.over(R.lensProp('position'));
const overSize = R.over(R.lensProp('size'));

//-----------------------------------------------------------------------------
//
// Basic utility
//
//-----------------------------------------------------------------------------

export const convertPositionValueToSlots = def(
  'convertPositionValueToSlots :: Number -> Number -> Number',
  (slotSize, px) => {
    const ratio = px / slotSize;
    const roundFn = ratio % 1 > 0.5 ? Math.ceil : Math.floor;
    return roundFn(px / slotSize * ROUNDING_ERROR) / ROUNDING_ERROR;
  }
);

//-----------------------------------------------------------------------------
//
// Migrations
//
//-----------------------------------------------------------------------------

const migratePosition = def(
  'migratePosition :: Position -> Position',
  R.unless(
    hasUnits,
    R.evolve({
      x: convertPositionValueToSlots(LEGACY_SLOT_GRID.WIDTH),
      y: convertPositionValueToSlots(LEGACY_SLOT_GRID.HEIGHT),
    })
  )
);

const migrateSize = def(
  'migrateSize :: Size -> Size',
  R.unless(
    hasUnits,
    R.evolve({
      width: w => Math.ceil(w / NEXT_SLOT_GRID.WIDTH),
      height: R.when(
        h => h !== 0,
        h => Math.ceil((h + LEGACY_SLOT_GRID.GAP) / NEXT_SLOT_GRID.HEIGHT)
      ),
    })
  )
);

const migrateDimensionsToSlots = def(
  'migrateDimensionsToSlots :: Object -> Object', // Node or Comment
  R.compose(overPosition(migratePosition), overSize(migrateSize))
);

//-----------------------------------------------------------------------------
//
// Units manipulations
//
//-----------------------------------------------------------------------------

const overNodesAndCommentsInPatch = def(
  'overNodesAndCommentsInPatch :: (a -> a) -> Object -> Object',
  (fn, patch) =>
    R.evolve({
      nodes: R.map(fn),
      comments: R.map(fn),
    })(patch)
);

// Adds `units` property into Position & Size of Nodes and Comments in the Patch
// Should be called only on saving already migrated project
const addPositionAndSizeUnitsToPatchEntities = def(
  'addPositionAndSizeUnitsToPatchEntities :: Object -> Object',
  overNodesAndCommentsInPatch(
    R.compose(
      R.when(
        R.has('size'),
        R.over(R.lensProp('size'), R.assoc('units', 'slots'))
      ),
      R.when(
        R.has('position'),
        R.over(R.lensProp('position'), R.assoc('units', 'slots'))
      )
    )
  )
);

const omitPositionAndSizeUnits = def(
  'omitPositionAndSizeUnits :: Object -> Object',
  R.compose(
    R.over(R.lensProp('size'), R.omit(['units'])),
    R.over(R.lensProp('position'), R.omit(['units']))
  )
);

//-----------------------------------------------------------------------------
//
// Public API
//
//-----------------------------------------------------------------------------

export { addPositionAndSizeUnitsToPatchEntities };

export const migratePatchDimensionsToSlots = def(
  'migratePatchDimensionsToSlots :: Object -> Object', // Almost Patch
  R.compose(
    overComments(R.pipe(migrateDimensionsToSlots, omitPositionAndSizeUnits)),
    overNodes(R.pipe(migrateDimensionsToSlots, omitPositionAndSizeUnits))
  )
);

/**
 * Returns Project with converted old pixels into slots of
 * Nodes' and Comments' positions and sizes.
 */
export const migrateProjectDimensionsToSlots = def(
  'migrateProjectDimensionsToSlots :: Object -> Project',
  overGenuinePatches(migratePatchDimensionsToSlots)
);
