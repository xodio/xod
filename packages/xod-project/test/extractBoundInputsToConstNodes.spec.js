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
      [getInputPinKey(XP.PIN_TYPE.BYTE)]: {
        type: XP.getTerminalPath(XP.PIN_DIRECTION.INPUT, XP.PIN_TYPE.BYTE),
        boundLiterals: {
          __out__: 'FAh',
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
      mainPatchPath,
      project
    );
    const mainPatch = XP.getPatchByPathUnsafe('@/main', newProject);

    const constNodes = R.ap(
      [
        findNodeByType(XP.CONST_NODETYPES[XP.PIN_TYPE.NUMBER]),
        findNodeByType(XP.CONST_NODETYPES[XP.PIN_TYPE.BOOLEAN]),
        findNodeByType(XP.CONST_NODETYPES[XP.PIN_TYPE.STRING]),
        findNodeByType(XP.CONST_NODETYPES[XP.PIN_TYPE.BYTE]),
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

  it("ignores 'Never' values bound to pulse pins", () => {
    const boundValue = XP.INPUT_PULSE_PIN_BINDING_OPTIONS.NEVER;
    const boundPinKey = getInputPinKey(XP.PIN_TYPE.PULSE);
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
      mainPatchPath,
      project
    );

    const patch = XP.getPatchByPathUnsafe(mainPatchPath, transformedProject);

    const nodesByNodeType = getNodesByNodeTypes(patch);
    assert.lengthOf(
      R.values(nodesByNodeType),
      7,
      'constant nodes with default pin values must be created'
    );

    const maybeBoundValue = XP.getBoundValue(
      boundPinKey,
      nodesByNodeType[testPatchPath]
    );
    assert(maybeBoundValue.isJust);
    assert.equal(maybeBoundValue.getOrElse(undefined), boundValue);

    const links = XP.listLinks(patch);
    assert.lengthOf(
      links,
      6,
      'links from constant nodes with default pin values must be created'
    );
  });

  it('creates constructors for unbound custom types', () => {
    const projectWithCustomTypes = Helper.defaultizeProject({
      patches: R.merge(constantPatches, {
        // custom type constructor that takes a primitive type as a parameter
        'someone/lib/custom': {
          nodes: {
            inNumber: {
              type: XP.getTerminalPath(
                XP.PIN_DIRECTION.INPUT,
                XP.PIN_TYPE.NUMBER
              ),
            },
            outSelf: { type: XP.OUTPUT_SELF_PATH },
          },
        },
        // custom type constructor that takes other custom type a parameter
        '@/my-custom': {
          nodes: {
            inCustom: { type: 'someone/lib/input-custom' },
            outSelf: { type: XP.OUTPUT_SELF_PATH },
          },
        },
        // a node that uses our complex custom type
        '@/test-node': {
          nodes: {
            inPairOfCustoms: { type: '@/input-my-custom' },
          },
        },
        '@/main': {
          nodes: {
            testNode: {
              type: '@/test-node',
            },
          },
        },
      }),
    });

    const transformedProject = XP.extractBoundInputsToConstNodes(
      '@/main',
      projectWithCustomTypes
    );

    const transformedPatch = XP.getPatchByPathUnsafe(
      '@/main',
      transformedProject
    );

    assert.lengthOf(
      XP.listLinks(transformedPatch),
      // between @/test-node, @/my-custom, someone/lib/custom and constant-number
      3
    );

    assert.sameMembers(
      R.compose(R.map(XP.getNodeType), XP.listNodes)(transformedPatch),
      [
        '@/test-node',
        '@/my-custom',
        'someone/lib/custom',
        'xod/core/constant-number',
      ]
    );
  });
});
