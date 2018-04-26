import R from 'ramda';
import { assert } from 'chai';

import * as XP from '../src';

import * as Helper from './helpers';

// TODO: automatically load from workspace?
import constantPatches from './fixtures/constant-patches.json';

// :: Patch -> Map NodeType Node
const getNodesByNodeTypes = R.compose(R.indexBy(XP.getNodeType), XP.listNodes);

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
        boundLiterals: {
          __out__: '37',
        },
      },
      'on-boot': {
        type: XP.getTerminalPath(XP.PIN_DIRECTION.INPUT, XP.PIN_TYPE.PULSE),
        boundLiterals: {
          __out__: 'On Boot',
        },
      },
      continuously: {
        type: XP.getTerminalPath(XP.PIN_DIRECTION.INPUT, XP.PIN_TYPE.PULSE),
        boundLiterals: {
          __out__: 'Continuously',
        },
      },
      'some-output': {
        type: XP.getTerminalPath(XP.PIN_DIRECTION.OUTPUT, XP.PIN_TYPE.NUMBER),
      },
      'some-other-output': {
        type: XP.getTerminalPath(XP.PIN_DIRECTION.OUTPUT, XP.PIN_TYPE.STRING),
      },
    },
  });
  const testProject = Helper.defaultizeProject({
    patches: R.merge(constantPatches, {
      [mainPatchPath]: {
        nodes: {
          'test-node': {
            type: testPatchPath,
            boundLiterals: {
              'some-output': '42',
            },
          },
        },
      },
      [testPatchPath]: testPatch,
    }),
  });

  const extractNodeFromProject = R.curry((nodeId, patchPath, projectObject) =>
    XP.getNodeByIdUnsafe(
      nodeId,
      XP.getPatchByPathUnsafe(patchPath, projectObject)
    )
  );

  it('leaves nodes without bound input values unchanged', () => {
    const project = R.clone(testProject);

    const newProject = XP.extractBoundInputsToConstNodes(
      project,
      mainPatchPath,
      project
    );
    const getTestNode = extractNodeFromProject('test-node', mainPatchPath);

    const originalNode = getTestNode(project);
    const newNode = getTestNode(newProject);

    assert.deepEqual(
      XP.getAllBoundValues(originalNode),
      XP.getAllBoundValues(newNode)
    );
  });

  it('extracts default bound values into constant nodes', () => {
    const findNodeByType = R.curry((type, patch) =>
      R.compose(R.propOr(null, type), R.indexBy(XP.getNodeType), XP.listNodes)(
        patch
      )
    );

    const project = R.clone(testProject);

    const newProject = XP.extractBoundInputsToConstNodes(
      project,
      mainPatchPath,
      project
    );
    const mainPatch = XP.getPatchByPathUnsafe('@/main', newProject);

    const constNodes = R.ap(
      [
        findNodeByType(XP.CONST_NODETYPES[XP.PIN_TYPE.NUMBER]),
        findNodeByType(XP.CONST_NODETYPES[XP.PIN_TYPE.BOOLEAN]),
        findNodeByType(XP.CONST_NODETYPES[XP.PIN_TYPE.STRING]),
        findNodeByType(
          XP.PULSE_CONST_NODETYPES[XP.INPUT_PULSE_PIN_BINDING_OPTIONS.ON_BOOT]
        ),
        findNodeByType(
          XP.PULSE_CONST_NODETYPES[
            XP.INPUT_PULSE_PIN_BINDING_OPTIONS.CONTINUOUSLY
          ]
        ),
      ],
      [mainPatch]
    );
    const doesAllConstNodesExist = R.all(R.complement(R.isNil), constNodes);

    assert.equal(doesAllConstNodesExist, true);
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
                boundLiterals: {
                  [boundPinKey]: boundValue,
                },
              },
            },
          },
          [testPatchPath]: testPatch,
        }),
      });

      const transformedProject = XP.extractBoundInputsToConstNodes(
        project,
        mainPatchPath,
        project
      );

      const patch = XP.getPatchByPathUnsafe(mainPatchPath, transformedProject);

      const nodesByNodeType = getNodesByNodeTypes(patch);

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

      const links = XP.listLinksByNode(constantNode, patch);
      const expectedLinksCount = dataType === XP.PIN_TYPE.PULSE ? 2 : 1;
      assert.lengthOf(
        links,
        expectedLinksCount,
        'a single link must be created'
      );

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
        const maybeBoundValue = XP.getBoundValue(
          constantNodeOutputPinKey,
          constantNode
        );
        assert(maybeBoundValue.isJust);
        assert.equal(
          maybeBoundValue.getOrElse(undefined),
          boundValue,
          `value from test node's pin must be bound to ${expectedConstNodeType}'s output`
        );
      }
    });

  testBoundPin(
    XP.PIN_TYPE.BOOLEAN,
    'True',
    XP.CONST_NODETYPES[XP.PIN_TYPE.BOOLEAN]
  );
  testBoundPin(
    XP.PIN_TYPE.NUMBER,
    '42',
    XP.CONST_NODETYPES[XP.PIN_TYPE.NUMBER]
  );
  testBoundPin(
    XP.PIN_TYPE.STRING,
    '"hello"',
    XP.CONST_NODETYPES[XP.PIN_TYPE.STRING]
  );

  testBoundPin(
    XP.PIN_TYPE.PULSE,
    XP.INPUT_PULSE_PIN_BINDING_OPTIONS.ON_BOOT,
    XP.PULSE_CONST_NODETYPES[XP.INPUT_PULSE_PIN_BINDING_OPTIONS.ON_BOOT],
    false
  );
  testBoundPin(
    XP.PIN_TYPE.PULSE,
    XP.INPUT_PULSE_PIN_BINDING_OPTIONS.CONTINUOUSLY,
    XP.PULSE_CONST_NODETYPES[XP.INPUT_PULSE_PIN_BINDING_OPTIONS.CONTINUOUSLY],
    false
  );

  it('discards any other values bound to pulse pins', () => {
    const boundValue = XP.INPUT_PULSE_PIN_BINDING_OPTIONS.NEVER;
    const boundPinKey = getInputPinKey(XP.PIN_TYPE.PULSE);
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

    const transformedProject = XP.extractBoundInputsToConstNodes(
      project,
      mainPatchPath,
      project
    );

    const patch = XP.getPatchByPathUnsafe(mainPatchPath, transformedProject);

    const nodesByNodeType = getNodesByNodeTypes(patch);
    assert.lengthOf(
      R.values(nodesByNodeType),
      6,
      'constant nodes with default pin values must be created'
    );

    const testNode = nodesByNodeType[testPatchPath];

    assert.isTrue(
      XP.getBoundValue(boundPinKey, testNode).isNothing,
      `bound value for ${boundPinKey} must be deleted from test node`
    );

    const links = XP.listLinks(patch);
    assert.lengthOf(
      links,
      5,
      'links from constant nodes with default pin values must be created'
    );
  });
});
