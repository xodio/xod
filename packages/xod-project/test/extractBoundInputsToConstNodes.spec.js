import R from 'ramda';
import { assert } from 'chai';

import * as XP from '../src';

import * as Helper from './helpers';

// TODO: automatically load from workspace?
import constantPatches from './fixtures/constant-patches.json';

describe('extractBoundInputsToConstNodes', () => {
  const mainPatchPath = XP.getLocalPath('main');
  const testPatchPath = XP.getLocalPath('test');

  const getInputPinKey = type => `${type}-input`;

  const testPatch = Helper.defaultizePatch({
    nodes: {
      [getInputPinKey(XP.PIN_TYPE.PULSE)]: {
        type: XP.getTerminalPath(XP.PIN_DIRECTION.INPUT, XP.PIN_TYPE.PULSE),
      },
      [getInputPinKey(XP.PIN_TYPE.BOOLEAN)]: {
        type: XP.getTerminalPath(XP.PIN_DIRECTION.INPUT, XP.PIN_TYPE.BOOLEAN),
      },
      [getInputPinKey(XP.PIN_TYPE.STRING)]: {
        type: XP.getTerminalPath(XP.PIN_DIRECTION.INPUT, XP.PIN_TYPE.STRING),
      },
      [getInputPinKey(XP.PIN_TYPE.NUMBER)]: {
        type: XP.getTerminalPath(XP.PIN_DIRECTION.INPUT, XP.PIN_TYPE.NUMBER),
      },
      'some-output': {
        type: XP.getTerminalPath(XP.PIN_DIRECTION.OUTPUT, XP.PIN_TYPE.NUMBER),
      },
      'some-other-output': {
        type: XP.getTerminalPath(XP.PIN_DIRECTION.OUTPUT, XP.PIN_TYPE.STRING),
      },
    },
  });

  it('leaves nodes without bound input values unchanged', () => {
    const project = Helper.defaultizeProject({
      patches: R.merge(constantPatches, {
        [mainPatchPath]: {
          nodes: {
            'test-node': {
              type: testPatchPath,
              boundValues: {
                'some-output': 42,
              },
            },
          },
        },
        [testPatchPath]: testPatch,
      }),
    });

    assert.deepEqual(
      project,
      XP.extractBoundInputsToConstNodes(project, mainPatchPath, project)
    );
  });

  const testBoundPin = (
    dataType,
    boundValue,
    expectedConstNodeType,
    checkConstNodeBoundValue = true // TODO: this flag is a bit hacky
  ) =>
    it(`should extract bound '${dataType}' pin value '${boundValue}' to '${expectedConstNodeType}' node`, () => {
      const boundPinKey = getInputPinKey(dataType);
      const testNodeId = 'test-node';

      const project = Helper.defaultizeProject({
        patches: R.merge(constantPatches, {
          [mainPatchPath]: {
            nodes: {
              [testNodeId]: {
                type: testPatchPath,
                boundValues: {
                  [boundPinKey]: boundValue,
                },
              },
            },
          },
          [testPatchPath]: testPatch,
        }),
      });

      const transformedProject = XP.extractBoundInputsToConstNodes(project, mainPatchPath, project);

      const patch = XP.getPatchByPathUnsafe(mainPatchPath, transformedProject);

      const nodesByNodeType = R.compose(
        R.indexBy(XP.getNodeType),
        XP.listNodes
      )(patch);

      const testNode = nodesByNodeType[testPatchPath];
      assert.isTrue(
        XP.getBoundValue(boundPinKey, testNode).isNothing,
        `bound value for ${boundPinKey} must be deleted from test node`
      );

      const constantNode = nodesByNodeType[expectedConstNodeType];
      assert.isDefined(
        constantNode,
        `node of type '${expectedConstNodeType}' should be created`
      );

      const constantNodeOutputPinKey = R.compose(
        XP.getPinKey,
        R.head,
        XP.listOutputPins,
        XP.getPatchByPathUnsafe(R.__, transformedProject)
      )(expectedConstNodeType);

      const links = XP.listLinks(patch);
      assert.lengthOf(links, 1, 'a single link must be created');

      const link = R.head(links);
      assert.equal(
        XP.getLinkOutputNodeId(link),
        XP.getNodeId(constantNode),
        `link must be from ${expectedConstNodeType} node`
      );
      assert.equal(
        XP.getLinkOutputPinKey(link),
        constantNodeOutputPinKey,
        `link must be from ${expectedConstNodeType}'s output pin`
      );

      assert.equal(
        XP.getLinkInputNodeId(link),
        testNodeId,
        'link must be to test node'
      );
      assert.equal(
        XP.getLinkInputPinKey(link),
        boundPinKey,
        `link must be to test node's ${boundPinKey} pin`
      );

      if (checkConstNodeBoundValue) {
        const maybeBoundValue = XP.getBoundValue(constantNodeOutputPinKey, constantNode);
        assert(maybeBoundValue.isJust);
        assert.equal(
          maybeBoundValue.getOrElse(undefined),
          boundValue,
          `value from test node's pin must be bound to ${expectedConstNodeType}'s output`
        );
      }
    });

  testBoundPin(XP.PIN_TYPE.BOOLEAN, true, XP.getConstantPatchPath(XP.PIN_TYPE.BOOLEAN));
  testBoundPin(XP.PIN_TYPE.NUMBER, 42, XP.getConstantPatchPath(XP.PIN_TYPE.NUMBER));
  testBoundPin(XP.PIN_TYPE.STRING, 'hello', XP.getConstantPatchPath(XP.PIN_TYPE.STRING));

  testBoundPin(
    XP.PIN_TYPE.PULSE,
    XP.INPUT_PULSE_PIN_BINDING_OPTIONS.ON_BOOT,
    'xod/core/boot',
    false
  );
  testBoundPin(
    XP.PIN_TYPE.PULSE,
    XP.INPUT_PULSE_PIN_BINDING_OPTIONS.CONTINUOUSLY,
    'xod/core/continuously',
    false
  );

  it('discards any other values bound to pulse pins', () => {
    const dataType = XP.PIN_TYPE.PULSE;
    const boundValue = XP.INPUT_PULSE_PIN_BINDING_OPTIONS.NEVER;
    const boundPinKey = getInputPinKey(dataType);
    const testNodeId = 'test-node';

    const project = Helper.defaultizeProject({
      patches: R.merge(constantPatches, {
        [mainPatchPath]: {
          nodes: {
            [testNodeId]: {
              type: testPatchPath,
              boundValues: {
                [boundPinKey]: boundValue,
              },
            },
          },
        },
        [testPatchPath]: testPatch,
      }),
    });

    const transformedProject = XP.extractBoundInputsToConstNodes(project, mainPatchPath, project);

    const patch = XP.getPatchByPathUnsafe(mainPatchPath, transformedProject);

    const nodesByNodeType = R.compose(
      R.indexBy(XP.getNodeType),
      XP.listNodes
    )(patch);
    assert.lengthOf(R.values(nodesByNodeType), 1, 'no new nodes must be created');
    const testNode = nodesByNodeType[testPatchPath];

    assert.isTrue(
      XP.getBoundValue(boundPinKey, testNode).isNothing,
      `bound value for ${boundPinKey} must be deleted from test node`
    );

    const links = XP.listLinks(patch);
    assert.lengthOf(links, 0, 'no links must be created');
  });
});
