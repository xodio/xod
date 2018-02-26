import R from 'ramda';
import { assert } from 'chai';
import { loadXodball } from './helpers';

import * as Node from '../src/node';
import * as Link from '../src/link';
import * as Patch from '../src/patch';
import * as Project from '../src/project';

import expandVariadicNodes from '../src/expandVariadicNodes';

describe('expandVariadicNodes', () => {
  it('expands a simple variadic patch', () => {
    const project = loadXodball('./fixtures/expanding.xodball');
    const expandedProject = expandVariadicNodes('@/main', project);

    assert.deepEqual(
      Project.getPatchByPathUnsafe('@/my-variadic', expandedProject),
      Project.getPatchByPathUnsafe('@/my-variadic', project),
      'expanded patch should not change'
    );

    const expected = loadXodball('./fixtures/expanding.expected.xodball');

    assert.sameMembers(
      Project.listPatchPaths(expandedProject),
      Project.listPatchPaths(expected),
    );

    assert.deepEqual(
      Project.getPatchByPathUnsafe('@/main', expandedProject),
      Project.getPatchByPathUnsafe('@/main', expected),
      'expanded node type should be updated'
    );

    const expandedPatch = Project.getPatchByPathUnsafe('@/my-variadic-$5', expandedProject);
    const expectedExpandedPatch = Project.getPatchByPathUnsafe('@/my-variadic-$5', expected);

    assert.deepEqual(
      Patch.listPins(expandedPatch),
      Patch.listPins(expectedExpandedPatch),
      'pins are equal'
    );

    const [
      expandedPatchNonTerminalNodes,
      expectedExpandedPatchNonTerminalNodes,
    ] = R.map(
      R.compose(
        R.sortBy(R.pipe(Node.getNodePosition, R.prop('x'))),
        R.reject(Node.isPinNode),
        Patch.listNodes
      ),
      [
        expandedPatch,
        expectedExpandedPatch,
      ]
    );

    const omitIds = R.map(R.dissoc('id'));

    assert.deepEqual(
      omitIds(expandedPatchNonTerminalNodes),
      omitIds(expectedExpandedPatchNonTerminalNodes),
      'non-terminal nodes are structurally equal'
    );

    // because nodes are structurally equal,
    // we can compare links by replacing node ids
    const correspondingExpectedNodeIds = R.compose(
      R.fromPairs,
      R.map(R.map(Node.getNodeId)),
      R.zip
    )(expandedPatchNonTerminalNodes, expectedExpandedPatchNonTerminalNodes);
    const replaceId = id => (correspondingExpectedNodeIds[id] || id);

    const expectedExpandedPatchLinks = R.compose(
      omitIds,
      Patch.listLinks
    )(expectedExpandedPatch);

    const expandedPatchLinks = R.compose(
      omitIds,
      R.map((link) => {
        const inputPinKey = Link.getLinkInputPinKey(link);
        const inputNodeId = R.compose(replaceId, Link.getLinkInputNodeId)(link);
        const outputPinKey = Link.getLinkOutputPinKey(link);
        const outputNodeId = R.compose(replaceId, Link.getLinkOutputNodeId)(link);

        return Link.createLink(inputPinKey, inputNodeId, outputPinKey, outputNodeId);
      }),
      Patch.listLinks
    )(expandedPatch);

    assert.deepEqual(
      expandedPatchLinks,
      expectedExpandedPatchLinks,
      'links are structurally equal'
    );
  });
});
