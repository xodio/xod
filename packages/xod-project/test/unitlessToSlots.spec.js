import * as R from 'ramda';
import { assert } from 'chai';

import { migrateProjectDimensionsToSlots } from '../src/migrations/unitlessToSlots';
import * as Project from '../src/project';
import * as Patch from '../src/patch';
import * as Node from '../src/node';
import * as Comment from '../src/comment';
import { addMissingOptionalProjectFields } from '../src/optionalFieldsUtils';

import * as Helper from './helpers';

describe('Migration: old dimensions to slots', () => {
  const loadXodballWithoutMigrating = R.compose(
    Project.injectProjectTypeHints,
    addMissingOptionalProjectFields,
    Helper.loadJSON
  );
  const project = loadXodballWithoutMigrating('./fixtures/blinking.xodball');

  // Getters
  const getActualNodePositions = R.compose(
    R.map(Node.getNodePosition),
    Patch.listNodes,
    Project.getPatchByPathUnsafe('@/blink')
  );
  const getActualCommentPositions = R.compose(
    R.map(Comment.getCommentPosition),
    Patch.listComments,
    Project.getPatchByPathUnsafe('@/blink')
  );
  const getActualCommentSizes = R.compose(
    R.map(Comment.getCommentSize),
    Patch.listComments,
    Project.getPatchByPathUnsafe('@/blink')
  );

  // Expected data for blinking project
  const expectedNodePositions = [
    { x: 7.75, y: 5 },
    { x: 8, y: 3.45 },
    { x: 7.9, y: 2.1 },
    { x: 7.9, y: 1 },
  ];
  const expectedCommentPositions = [{ x: 1.25, y: 1 }];
  const expectedCommentSizes = [{ width: 4, height: 2 }];

  it('on Blinking project', () => {
    const convertedProject = migrateProjectDimensionsToSlots(project);

    // Check Nodes' Position
    const actualNodePositions = getActualNodePositions(convertedProject);
    assert.sameDeepMembers(actualNodePositions, expectedNodePositions);

    // Check Comments' Position
    const actualCommentPositions = getActualCommentPositions(convertedProject);
    assert.sameDeepMembers(actualCommentPositions, expectedCommentPositions);

    // Check Comments' Size
    const actualCommentSizes = getActualCommentSizes(convertedProject);
    assert.sameDeepMembers(actualCommentSizes, expectedCommentSizes);
  });
});
