import R from 'ramda';
import { assert } from 'chai';
import * as XF from 'xod-func-tools';

import * as Pin from '../src/pin';
import * as Patch from '../src/patch';
import * as Node from '../src/node';
import * as Link from '../src/link';
import * as Comment from '../src/comment';
import * as Attachment from '../src/attachment';
import * as CONST from '../src/constants';
import * as PPU from '../src/patchPathUtils';

import { TERMINALS_LIB_NAME } from '../src/internal/patchPathUtils';

import * as Helper from './helpers';

const emptyPatch = Helper.defaultizePatch({});

describe('Patch', () => {
  // constructors
  describe('createPatch', () => {
    it('should return Patch that is an object', () => {
      const patch = Patch.createPatch();

      assert.isObject(patch);
    });
    it('should have key: nodes === {}', () => {
      const patch = Patch.createPatch();

      assert.isObject(patch.nodes);
      assert.isEmpty(patch.nodes);
    });
    it('should have key: links === {}', () => {
      const patch = Patch.createPatch();

      assert.isObject(patch.links);
      assert.isEmpty(patch.links);
    });
  });
  describe('duplicatePatch', () => {
    const patch = Helper.defaultizePatch({ nodes: {}, label: 'test' });
    it('should return new patch (not the same object)', () => {
      const newPatch = Patch.duplicatePatch(patch);

      assert.notStrictEqual(newPatch, patch);
    });
    it('should be deeply cloned (not the same nested objects)', () => {
      const newPatch = Patch.duplicatePatch(patch);

      assert.equal(newPatch.label, patch.label);
      assert.notStrictEqual(newPatch.nodes, patch.nodes);
    });
  });

  describe('implementation', () => {
    describe('getImpl', () => {
      it('should return Nothing for empty patch', () => {
        const maybeImpl = Patch.getImpl(emptyPatch);
        assert.isTrue(maybeImpl.isNothing);
      });
      it('should return Nothing for patch without impl attachment', () => {
        const patch = Helper.defaultizePatch({
          attachments: [
            Attachment.createAttachment(
              'some-random-file.cpp',
              'utf-8',
              '// whatever'
            ),
          ],
        });
        const maybeImpl = Patch.getImpl(patch);
        assert.isTrue(maybeImpl.isNothing);
      });
      it('should return Just Source with implementation for patch with impl attachment', () => {
        const expectedSource = '// ok!';
        const patch = Helper.defaultizePatch({
          attachments: [Attachment.createImplAttachment(expectedSource)],
        });
        const maybeImpl = Patch.getImpl(patch);
        assert.isTrue(maybeImpl.isJust);
        assert.equal(maybeImpl.getOrElse(null), expectedSource);
      });
    });
    describe('hasImpl', () => {
      it('should return false for empty patch', () => {
        assert.isFalse(Patch.hasImpl(emptyPatch));
      });
      it('should return false for patch without impl attachment', () => {
        const patch = Helper.defaultizePatch({
          attachments: [
            Attachment.createAttachment(
              'some-random-file.cpp',
              'utf-8',
              '// whatever'
            ),
          ],
        });
        assert.isFalse(Patch.hasImpl(patch));
      });
      it('should return true for patch with impl attachment', () => {
        const expectedSource = '// ok!';
        const patch = Helper.defaultizePatch({
          attachments: [Attachment.createImplAttachment(expectedSource)],
        });
        assert.isTrue(Patch.hasImpl(patch));
      });
    });
    describe('setImpl', () => {
      it('should add impl attachment if none existed', () => {
        const patch = Helper.defaultizePatch({
          attachments: [
            Attachment.createAttachment(
              'not-an-implementation.cpp',
              'utf-8',
              '// whatever'
            ),
          ],
        });
        const expectedSource = '// ok!';

        const updatedPatch = Patch.setImpl(expectedSource, patch);

        assert.equal(
          Patch.getImpl(updatedPatch).getOrElse(null),
          expectedSource
        );
        assert.lengthOf(Patch.getPatchAttachments(updatedPatch), 2);
      });
      it('should update existing impl attachment', () => {
        const patch = Helper.defaultizePatch({
          attachments: [
            Attachment.createAttachment(
              'some-random-file.cpp',
              'utf-8',
              '// whatever'
            ),
            Attachment.createImplAttachment('// initial implementation'),
          ],
        });
        const expectedSource = '// updated!';

        const updatedPatch = Patch.setImpl(expectedSource, patch);

        assert.equal(
          Patch.getImpl(updatedPatch).getOrElse(null),
          expectedSource,
          'implementation source is updated'
        );

        const getAttachmentFilenames = R.compose(
          R.map(Attachment.getFilename),
          Patch.getPatchAttachments
        );

        assert.sameMembers(
          getAttachmentFilenames(patch),
          getAttachmentFilenames(updatedPatch),
          'no new attachments is added'
        );
      });
    });
  });

  describe('isTerminalPatch', () => {
    it('should return false for empty', () => {
      assert.isFalse(Patch.isTerminalPatch(emptyPatch));
    });
    it('should return false for patch without terminal pin', () => {
      const patch = Helper.defaultizePatch({});
      assert.isFalse(Patch.isTerminalPatch(patch));
    });
    it('should return true for input terminal', () => {
      const patch = Helper.defaultizePatch({
        path: 'xod/patch-nodes/input-number',
      });
      assert.isTrue(Patch.isTerminalPatch(patch));
    });
    it('should return true for output terminal', () => {
      const patch = Helper.defaultizePatch({
        path: 'xod/patch-nodes/output-number',
      });
      assert.isTrue(Patch.isTerminalPatch(patch));
    });
  });

  // entity getters
  describe('listNodes', () => {
    const patch = Helper.defaultizePatch({
      nodes: {
        rndId: { id: 'rndId' },
        rndId2: { id: 'rndId2' },
      },
    });

    it('should return an empty array for empty patch', () => {
      assert.deepEqual(Patch.listNodes(emptyPatch), []);
    });
    it('should return an array of nodes', () => {
      assert.sameMembers(Patch.listNodes(patch), [
        patch.nodes.rndId,
        patch.nodes.rndId2,
      ]);
    });
  });
  describe('nodeIdEquals', () => {
    it('should return false for not equal ids', () => {
      assert.isFalse(Patch.nodeIdEquals('1', '2'));
      assert.isFalse(Patch.nodeIdEquals('1', { id: '2' }));
    });
    it('should return true for equal ids', () => {
      assert.isTrue(Patch.nodeIdEquals('1', '1'));
      assert.isTrue(Patch.nodeIdEquals('1', { id: '1' }));
    });
  });
  describe('getNodeById', () => {
    const patch = Helper.defaultizePatch({
      nodes: {
        rndId: { id: 'rndId' },
      },
    });

    it('should Maybe.Nothing for non-existent node', () => {
      const maybeNode = Patch.getNodeById('non-existent', emptyPatch);
      assert.isTrue(maybeNode.isNothing);
    });
    it('should Maybe.Just with node for existent node', () => {
      assert.isTrue(Patch.getNodeById('rndId', patch).isJust);
      Helper.expectMaybeJust(
        Patch.getNodeById('rndId', patch),
        patch.nodes.rndId
      );
    });
  });
  describe('getNodeByIdUnsafe', () => {
    const patch = Helper.defaultizePatch({
      path: 'test/test/test',
      nodes: {
        rndId: { id: 'rndId' },
      },
    });

    it('should throw Error', () => {
      const nodeId = 'non-existent';

      assert.throws(
        () => Patch.getNodeByIdUnsafe(nodeId, patch),
        `Can't find the Node "non-existent" in the patch with path "test/test/test"`
      );
    });
    it('should return Node', () => {
      const node = Patch.getNodeByIdUnsafe('rndId', patch);
      assert.equal(node, patch.nodes.rndId);
    });
  });

  describe('listLinks', () => {
    const patch = Helper.defaultizePatch({
      links: {
        1: { id: '1' },
        2: { id: '2' },
      },
    });

    it('should return an empty array for empty patch', () => {
      assert.deepEqual(Patch.listLinks(emptyPatch), []);
    });
    it('should return an array of links', () => {
      assert.sameMembers(Patch.listLinks(patch), [
        patch.links['1'],
        patch.links['2'],
      ]);
    });
  });
  describe('linkIdEquals', () => {
    it('should return false for not equal ids', () => {
      assert.isFalse(Patch.linkIdEquals('1', '2'));
      assert.isFalse(Patch.linkIdEquals('1', { id: '2' }));
    });
    it('should return true for equal ids', () => {
      assert.isTrue(Patch.linkIdEquals('1', '1'));
      assert.isTrue(Patch.linkIdEquals('1', { id: '1' }));
    });
  });
  describe('getLinkById', () => {
    const patch = Helper.defaultizePatch({
      links: {
        1: { id: '1' },
      },
    });

    it('should Maybe.Nothing for non-existent link', () => {
      assert.isTrue(Patch.getLinkById('non-existent', emptyPatch).isNothing);
    });
    it('should Maybe.Just with link for existent link', () => {
      Helper.expectMaybeJust(Patch.getLinkById('1', patch), patch.links[1]);
    });
  });
  describe('listLinksByNode', () => {
    const patch = Helper.defaultizePatch({
      links: {
        1: {
          id: '1',
          input: { pinKey: 'fromPin', nodeId: '@/from' },
          output: { pinKey: 'toPin', nodeId: '@/to' },
        },
      },
      nodes: {
        '@/from': { id: '@/from' },
        '@/to': { id: '@/to' },
      },
    });

    it('should return empty array for non-existent node', () => {
      assert.deepEqual(Patch.listLinksByNode('@/non-existent', patch), []);
    });
    it('should return empty array for empty patch', () => {
      assert.deepEqual(Patch.listLinksByNode('@/a', patch), []);
    });
    it('should return array with one link', () => {
      assert.deepEqual(Patch.listLinksByNode('@/from', patch), [
        patch.links[1],
      ]);
    });
  });
  describe('listLinksByPin', () => {
    const patch = Helper.defaultizePatch({
      links: {
        1: {
          id: '1',
          input: { pinKey: 'fromPin', nodeId: '@/from' },
          output: { pinKey: 'toPin', nodeId: '@/to' },
        },
      },
      nodes: {
        '@/from': { id: '@/from' },
        '@/to': { id: '@/to' },
      },
    });

    it('should return empty array for non-existent node', () => {
      assert.deepEqual(
        Patch.listLinksByPin('fromPin', '@/non-existent', patch),
        []
      );
    });
    it('should return empty array for empty patch', () => {
      assert.deepEqual(
        Patch.listLinksByPin('fromPin', '@/from', emptyPatch),
        []
      );
    });
    it('should return empty array for pinKey in input and nodeId in output', () => {
      assert.deepEqual(Patch.listLinksByPin('fromPin', '@/to', patch), []);
    });
    it('should return array with one link', () => {
      assert.deepEqual(Patch.listLinksByPin('fromPin', '@/from', patch), [
        patch.links[1],
      ]);
    });
  });
  describe('listLibraryNamesUsedInPatch', () => {
    it('returns an empty list for empty patch', () =>
      assert.isEmpty(
        Patch.listLibraryNamesUsedInPatch(Helper.defaultizePatch({}))
      ));
    it('returns an empty list if Patch used only Nodes from local project or builtIns', () =>
      assert.isEmpty(
        Patch.listLibraryNamesUsedInPatch(
          Helper.defaultizePatch({
            nodes: {
              a: { type: '@/my-patch' },
              b: { type: `${TERMINALS_LIB_NAME}/input-number` },
            },
          })
        )
      ));
    it('returns a list of two libNames', () =>
      assert.sameMembers(
        Patch.listLibraryNamesUsedInPatch(
          Helper.defaultizePatch({
            nodes: {
              a: { type: 'xod/core/flip-flop' },
              b: { type: 'xod/core/clock' },
              c: { type: 'xod/common-hardware/led' },
            },
          })
        ),
        ['xod/core', 'xod/common-hardware']
      ));
  });

  describe('pins', () => {
    const patch = Helper.defaultizePatch({
      nodes: {
        in: {
          id: 'in',
          type: 'xod/patch-nodes/input-boolean',
          label: 'in',
        },
        out: {
          id: 'out',
          type: 'xod/patch-nodes/output-boolean',
          label: 'out',
        },
      },
    });

    const expectedPins = {
      in: {
        '@@type': 'xod-project/Pin',
        key: 'in',
        direction: CONST.PIN_DIRECTION.INPUT,
        type: 'boolean',
        label: 'in',
        description: '',
        order: 0,
        defaultValue: 'False',
        isBindable: true,
      },
      out: {
        '@@type': 'xod-project/Pin',
        key: 'out',
        direction: CONST.PIN_DIRECTION.OUTPUT,
        type: 'boolean',
        label: 'out',
        description: '',
        order: 0,
        defaultValue: 'False',
        isBindable: false,
      },
    };

    describe('getPinByKey', () => {
      it('should return Maybe.Nothing for empty patch', () => {
        const res = Patch.getPinByKey('a', emptyPatch);
        assert.isTrue(res.isNothing);
      });
      it('should return Maybe.Just for patch with pin node', () => {
        const aPatch = Helper.defaultizePatch({
          nodes: {
            a: {
              id: 'a',
              type: 'xod/patch-nodes/input-boolean',
              position: { x: 0, y: 0 },
            },
          },
        });

        const maybePinKey = R.compose(
          R.map(Pin.getPinKey),
          Patch.getPinByKey('a')
        )(aPatch);
        Helper.expectMaybeJust(maybePinKey, 'a');
      });
    });
    describe('listPins', () => {
      it('should return empty array for empty patch', () => {
        assert.deepEqual(Patch.listPins(emptyPatch), []);
      });
      it('should return array with two pins', () => {
        assert.sameDeepMembers(
          [expectedPins.in, expectedPins.out],
          Patch.listPins(patch)
        );
      });
    });
    describe('listInputPins', () => {
      it('should return empty array for empty patch', () => {
        assert.deepEqual(Patch.listInputPins(emptyPatch), []);
      });
      it('should return array with one pin', () => {
        assert.sameDeepMembers([expectedPins.in], Patch.listInputPins(patch));
      });
    });
    describe('listOutputPins', () => {
      it('should return empty array for empty patch', () => {
        assert.deepEqual(Patch.listOutputPins(emptyPatch), []);
      });
      it('should return array with one pin', () => {
        assert.sameDeepMembers([expectedPins.out], Patch.listOutputPins(patch));
      });
    });

    describe('computing from terminals', () => {
      it('should order pins by x coordinate of terminal nodes', () => {
        const inputBooleanType = PPU.getTerminalPath(
          CONST.PIN_DIRECTION.INPUT,
          CONST.PIN_TYPE.BOOLEAN
        );
        /**
        +-----+   +-----+   +-----+
        |     |   |     |   |     |
        |  0  |   |  1  |   |  2  |
        |     |   |     |   |     |
        +-----+   +-----+   +-----+
         */
        const testPatch = Helper.defaultizePatch({
          nodes: {
            in0: {
              type: inputBooleanType,
              position: { x: 0, y: 0 },
            },
            in1: {
              type: inputBooleanType,
              position: { x: 100, y: 0 },
            },
            in2: {
              type: inputBooleanType,
              position: { x: 200, y: 0 },
            },
          },
        });

        const orderedPinKeys = R.compose(
          R.map(Pin.getPinKey),
          R.sortBy(Pin.getPinOrder),
          Patch.listPins
        )(testPatch);

        assert.deepEqual(orderedPinKeys, ['in0', 'in1', 'in2']);
      });
      it('should order pins with the same x coordinate of terminal nodes by y', () => {
        const inputBooleanType = PPU.getTerminalPath(
          CONST.PIN_DIRECTION.INPUT,
          CONST.PIN_TYPE.BOOLEAN
        );
        /**
         +-----+   +-----+
         |     |   |     |
         |  0  |   |  2  |
         |     |   |     |
         +-----+   +-----+

         +-----+
         |     |
         |  1  |
         |     |
         +-----+
         */
        const testPatch = Helper.defaultizePatch({
          nodes: {
            in0: {
              type: inputBooleanType,
              position: { x: 0, y: 0 },
            },
            in1: {
              type: inputBooleanType,
              position: { x: 0, y: 100 },
            },
            in2: {
              type: inputBooleanType,
              position: { x: 100, y: 0 },
            },
          },
        });

        const orderedPinKeys = R.compose(
          R.map(Pin.getPinKey),
          R.sortBy(Pin.getPinOrder),
          Patch.listPins
        )(testPatch);

        assert.deepEqual(orderedPinKeys, ['in0', 'in1', 'in2']);
      });
      it("should extract defaultValue from terminal's bound values", () => {
        const testPatch = Helper.defaultizePatch({
          nodes: {
            inStr: {
              type: PPU.getTerminalPath(
                CONST.PIN_DIRECTION.INPUT,
                CONST.PIN_TYPE.STRING
              ),
              boundLiterals: {
                [CONST.TERMINAL_PIN_KEYS[CONST.PIN_DIRECTION.OUTPUT]]: 'hello',
              },
            },
            outNum: {
              type: PPU.getTerminalPath(
                CONST.PIN_DIRECTION.OUTPUT,
                CONST.PIN_TYPE.NUMBER
              ),
              boundLiterals: {
                [CONST.TERMINAL_PIN_KEYS[CONST.PIN_DIRECTION.INPUT]]: 42,
              },
            },
          },
        });

        const pinDefaultValues = R.compose(
          R.map(Pin.getPinDefaultValue),
          R.indexBy(Pin.getPinKey),
          Patch.listPins
        )(testPatch);

        assert.deepEqual({ inStr: 'hello', outNum: 42 }, pinDefaultValues);
      });
      it('should set defaultValue to default for type if terminal has no bound values', () => {
        const testPatch = Helper.defaultizePatch({
          nodes: {
            inStr: {
              type: PPU.getTerminalPath(
                CONST.PIN_DIRECTION.INPUT,
                CONST.PIN_TYPE.STRING
              ),
              boundLiterals: {},
            },
            outNum: {
              type: PPU.getTerminalPath(
                CONST.PIN_DIRECTION.OUTPUT,
                CONST.PIN_TYPE.NUMBER
              ),
              boundLiterals: {},
            },
          },
        });

        const pinDefaultValues = R.compose(
          R.map(Pin.getPinDefaultValue),
          R.indexBy(Pin.getPinKey),
          Patch.listPins
        )(testPatch);

        assert.deepEqual({ inStr: '""', outNum: '0' }, pinDefaultValues);
      });
    });

    describe('output-self terminals', () => {
      it('should produce output pin with the type named after constructor patch', () => {
        const testPatch = Helper.defaultizePatch({
          path: '@/my-custom-type',
          nodes: {
            outSelf: {
              type: CONST.OUTPUT_SELF_PATH,
              position: { x: 0, y: 100 },
            },
          },
        });

        const pin = R.compose(R.head, Patch.listOutputPins)(testPatch);

        assert.equal(Pin.getPinType(pin), '@/my-custom-type');
      });
      it('should allow more than one output-self pins', () => {
        const testPatch = Helper.defaultizePatch({
          path: '@/my-custom-type',
          nodes: {
            outSelf: {
              type: CONST.OUTPUT_SELF_PATH,
              position: { x: 0, y: 100 },
            },
            outSelf2: {
              type: CONST.OUTPUT_SELF_PATH,
              position: { x: 100, y: 100 },
            },
            outSelf3: {
              type: CONST.OUTPUT_SELF_PATH,
              position: { x: 200, y: 100 },
            },
          },
        });

        const pinTypes = R.compose(R.map(Pin.getPinType), Patch.listOutputPins)(
          testPatch
        );

        assert.deepEqual(pinTypes, [
          '@/my-custom-type',
          '@/my-custom-type',
          '@/my-custom-type',
        ]);
      });
    });

    describe('validatePinLabels', () => {
      it('does not complain about pins with empty labels', () => {
        const okPatch = Helper.defaultizePatch({
          nodes: {
            in: {
              id: 'in',
              type: 'xod/patch-nodes/input-boolean',
              label: 'in',
            },
            out: {
              id: 'out',
              type: 'xod/patch-nodes/output-boolean',
              label: 'out',
            },
          },
        });

        Helper.expectEitherRight(
          R.equals(okPatch),
          Patch.validatePinLabels(okPatch)
        );
      });

      it('returns Either.Left when there are two pins with the same label', () => {
        const patchWithClashingPinLabels = Helper.defaultizePatch({
          nodes: {
            in: {
              id: 'in',
              type: 'xod/patch-nodes/input-boolean',
              label: 'FOO',
            },
            out: {
              id: 'out',
              type: 'xod/patch-nodes/output-boolean',
              label: 'FOO',
            },
          },
        });

        Helper.expectEitherError(
          'CLASHING_PIN_LABELS {"label":"FOO","pinKeys":["in","out"],"trace":["@/default-patch-path"]}',
          Patch.validatePinLabels(patchWithClashingPinLabels)
        );
      });

      it('returns Either.Left when user-entered label clashes with autogenerated one', () => {
        const patchWithClashingPinLabels = Helper.defaultizePatch({
          nodes: {
            in: {
              id: 'in',
              type: 'xod/patch-nodes/input-boolean',
              label: '',
            },
            out: {
              id: 'out',
              type: 'xod/patch-nodes/output-boolean',
              label: 'IN',
            },
          },
        });

        Helper.expectEitherError(
          'CLASHING_PIN_LABELS {"label":"IN","pinKeys":["in","out"],"trace":["@/default-patch-path"]}',
          Patch.validatePinLabels(patchWithClashingPinLabels)
        );
      });

      it('returns Either.Left when there are more than two pins with the same label', () => {
        const patchWithClashingPinLabels = Helper.defaultizePatch({
          nodes: {
            in1: {
              id: 'in1',
              type: 'xod/patch-nodes/input-boolean',
              label: 'FOO',
            },
            in2: {
              id: 'in2',
              type: 'xod/patch-nodes/input-number',
              label: 'FOO',
            },
            out1: {
              id: 'out1',
              type: 'xod/patch-nodes/output-boolean',
              label: 'FOO',
            },
            out2: {
              id: 'out2',
              type: 'xod/patch-nodes/output-number',
              label: 'FOO',
            },
            notClashing1: {
              id: 'notClashing1',
              type: 'xod/patch-nodes/output-number',
              label: 'OK',
            },
            notClashing2: {
              id: 'notClashing2',
              type: 'xod/patch-nodes/output-number',
              label: '',
            },
          },
        });

        Helper.expectEitherError(
          'CLASHING_PIN_LABELS {"label":"FOO","pinKeys":["in1","in2","out1","out2"],"trace":["@/default-patch-path"]}',
          Patch.validatePinLabels(patchWithClashingPinLabels)
        );
      });
    });
  });

  describe('comments', () => {
    const testComment1 = Comment.createComment(
      { x: 101, y: 201 },
      { width: 1101, height: 2001 },
      'test comment 1'
    );
    const testComment2 = Comment.createComment(
      { x: 102, y: 202 },
      { width: 1102, height: 2002 },
      'test comment 2'
    );

    const patchWithComments = R.compose(
      Patch.assocComment(testComment2),
      Patch.assocComment(testComment1)
    )(emptyPatch);

    describe('assocComment', () => {
      it('should return a new Patch with a specified Comment added', () => {
        const newPatch = Patch.assocComment(testComment1, emptyPatch);

        assert.deepEqual(
          Patch.getCommentByIdUnsafe(
            Comment.getCommentId(testComment1),
            newPatch
          ),
          testComment1
        );
      });
    });
    describe('dissocComment', () => {
      it('should return a new Patch without added Comment', () => {
        const commentId = Comment.getCommentId(testComment1);
        const newPatch = Patch.dissocComment(commentId, patchWithComments);

        const maybeComment = Patch.getCommentById(commentId, newPatch);

        assert.equal(maybeComment.isNothing, true);
      });
    });
    describe('listComments', () => {
      it('should return an empty array for an empty patch', () => {
        assert.deepEqual(
          Patch.listComments(emptyPatch),
          [],
          'empty patch should not have any comments'
        );
      });

      it('should return an array of comments added to patch', () => {
        assert.sameMembers(Patch.listComments(patchWithComments), [
          testComment1,
          testComment2,
        ]);
      });
    });
    describe('getCommentById', () => {
      it('should return Just Commment for an existing Comment', () => {
        const maybeComment = Patch.getCommentById(
          Comment.getCommentId(testComment1),
          patchWithComments
        );

        assert.equal(maybeComment.isJust, true);
      });
      it('should return Nothing for a non-existing Comment', () => {
        const maybeComment = Patch.getCommentById(
          'non-existing',
          patchWithComments
        );

        assert.equal(maybeComment.isNothing, true);
      });
    });
    describe('getCommentByIdUnsafe', () => {
      it('should return a Commment if a Comment with a given CommentId exists', () => {
        const comment = Patch.getCommentByIdUnsafe(
          Comment.getCommentId(testComment1),
          patchWithComments
        );

        assert.equal(comment, testComment1);
      });
      it('should throw Error if a Comment with a given CommentId does not exist', () => {
        const nonExistingCommentId = 'non-existing';
        assert.throws(
          () =>
            Patch.getCommentByIdUnsafe(nonExistingCommentId, patchWithComments),
          `Can't find the Comment "non-existing" in the patch with path "@/default-patch-path"`
        );
      });
    });
    describe('upsertComments', () => {
      it('should return a new patch with upserted links', () => {
        const commentsList = [testComment1, testComment2];
        const newPatch = Patch.upsertComments(commentsList, emptyPatch);

        assert.sameMembers(Patch.listComments(newPatch), commentsList);
      });
    });
  });

  // entity setters
  describe('assocNode', () => {
    it('should return Patch with new Node', () => {
      const node = Helper.defaultizeNode({ id: '1' });
      const newPatch = Patch.assocNode(node, emptyPatch);

      assert.equal(Patch.getNodeByIdUnsafe('1', newPatch), node);
    });
    it('should replace old Node with same id', () => {
      const patch = Helper.defaultizePatch({
        nodes: {
          1: { id: '1', label: 'old' },
        },
      });

      const node = Helper.defaultizeNode({
        id: '1',
        label: 'new',
      });

      const newPatch = Patch.assocNode(node, patch);

      assert.equal(Patch.getNodeByIdUnsafe('1', newPatch), node);
    });
    it('should add pin by associating terminal node', () => {
      const node = Helper.defaultizeNode({
        id: '1',
        type: 'xod/patch-nodes/input-number',
        label: 'A',
      });
      const newPatch = Patch.assocNode(node, emptyPatch);

      const expectedPin = Pin.createPin(
        '1',
        'number',
        'input',
        0,
        'A',
        '',
        true,
        '0'
      );

      assert.deepEqual([expectedPin], Patch.listPins(newPatch));
    });
    it('should update pin by associating terminal Node with the same id', () => {
      const patch = Helper.defaultizePatch({
        nodes: {
          1: {
            id: '1',
            type: 'xod/patch-nodes/output-string',
          },
        },
      });

      const expectedPinBeforeUpdate = Pin.createPin(
        '1',
        'string',
        'output',
        0,
        '',
        '',
        false,
        '""'
      );
      assert.deepEqual([expectedPinBeforeUpdate], Patch.listPins(patch));

      const node = Helper.defaultizeNode({
        id: '1',
        type: 'xod/patch-nodes/input-number',
        label: 'A',
      });
      const newPatch = Patch.assocNode(node, patch);

      const expectedPinAfterUpdate = Pin.createPin(
        '1',
        'number',
        'input',
        0,
        'A',
        '',
        true,
        '0'
      );
      assert.deepEqual([expectedPinAfterUpdate], Patch.listPins(newPatch));
    });
  });
  describe('dissocNode', () => {
    const patch = Helper.defaultizePatch({
      nodes: {
        rndId: { id: 'rndId' },
        rndId2: { id: 'rndId2' },
      },
      links: {
        1: {
          id: '1',
          output: { pinKey: 'out', nodeId: 'rndId' },
          input: { pinKey: 'in', nodeId: 'rndId2' },
        },
      },
    });

    it('should remove node by id', () => {
      const newPatch = Patch.dissocNode('rndId', patch);

      assert.isTrue(Patch.getNodeById('rndId', newPatch).isNothing);
    });
    it('should remove node by Node object', () => {
      const node = patch.nodes.rndId;
      const newPatch = Patch.dissocNode(node, patch);

      assert.isTrue(Patch.getNodeById('rndId', newPatch).isNothing);
    });
    it('should remove connected link', () => {
      const node = patch.nodes.rndId;
      const newPatch = Patch.dissocNode(node, patch);

      assert.deepEqual(Patch.listLinks(newPatch), []);
    });
    it('should not affect on other nodes', () => {
      const newPatch = Patch.dissocNode('rndId', patch);

      assert.isTrue(Patch.getNodeById('rndId', newPatch).isNothing);
      assert.isTrue(Patch.getNodeById('rndId2', newPatch).isJust);
    });
    it('should return unchanges Patch for non-existent node/id', () => {
      assert.deepEqual(Patch.dissocNode('@/non-existent', patch), patch);
      assert.deepEqual(
        Patch.dissocNode({ id: '@/non-existent' }, patch),
        patch
      );
    });
    it('should remove pin from patch on dissoc pinNode', () => {
      const patchWithPins = Helper.defaultizePatch({
        nodes: {
          a: { id: 'a', type: 'xod/patch-nodes/input-number' },
          b: { id: 'b', type: 'xod/patch-nodes/output-number' },
        },
      });
      const newPatch = Patch.dissocNode('a', patchWithPins);
      assert.deepEqual(
        ['b'],
        R.compose(R.map(Pin.getPinKey), Patch.listPins)(newPatch)
      );
    });
  });

  describe('assocLink', () => {
    // TODO: Add patch for assocLink
    // const patch = {
    //   nodes: {
    //     in: { id: 'in' },
    //     out: { id: 'out' },
    //   },
    // };
    // it('should return Either.Left for invalid link', () => {
    //   expect(Patch.assocLink({}, {}).isLeft).to.be.true();
    // })
    // it('should return Either.Right with patch and assigned new link', () => {
    //
    // });
  });
  describe('dissocLink', () => {
    const patch = Helper.defaultizePatch({
      links: {
        1: { id: '1' },
        2: { id: '2' },
      },
    });

    it('should remove link by id', () => {
      const newPatch = Patch.dissocLink('1', patch);

      Helper.expectMaybeNothing(Patch.getLinkById('1', newPatch));
    });
    it('should remove node by Link object', () => {
      const link = patch.links['1'];
      const newPatch = Patch.dissocLink(link, patch);

      Helper.expectMaybeNothing(Patch.getLinkById('1', newPatch));
    });
    it('should not affect on other links', () => {
      const newPatch = Patch.dissocLink('1', patch);

      // it still has a link with id '2'
      assert.deepEqual(
        Patch.getLinkByIdUnsafe('2', newPatch),
        Patch.getLinkByIdUnsafe('2', patch)
      );

      Helper.expectMaybeNothing(Patch.getLinkById('1', newPatch));
    });
    it('should return unchanges Patch for non-existent link/id', () => {
      assert.deepEqual(Patch.dissocLink('3', patch), patch);
      assert.deepEqual(Patch.dissocLink({ id: '3' }, patch), patch);
    });
  });

  describe('upsertNodes & upsertLinks', () => {
    const patch = Patch.createPatch();

    it('should return patch with upserted nodes and upserted links', () => {
      const newNodes = [
        Node.createNode({ x: 0, y: 0 }, '@/yay'),
        Node.createNode({ x: 0, y: 0 }, '@/awesome'),
      ];
      const patchWithNodes = Patch.upsertNodes(newNodes, patch);

      assert.sameDeepMembers(Patch.listNodes(patchWithNodes), newNodes);

      const nodeIds = R.map(Node.getNodeId, newNodes);
      const newLinks = [
        Link.createLink('IN_A', nodeIds[0], 'OUTA', nodeIds[1]),
        Link.createLink('IN_B', nodeIds[0], 'OUTB', nodeIds[1]),
      ];

      const patchWithLinks = Patch.upsertLinks(newLinks, patchWithNodes);

      assert.isTrue(patchWithLinks.isRight);
      assert.sameDeepMembers(
        Patch.listLinks(XF.explodeEither(patchWithLinks)),
        newLinks
      );
    });
  });

  describe('validateLink', () => {
    const patch = Helper.defaultizePatch({
      nodes: {
        out: { id: 'out' },
        in: { id: 'in' },
      },
    });
    const linkId = '1';
    const validInput = {
      nodeId: 'in',
      pinKey: 'in',
    };
    const validOutput = {
      nodeId: 'out',
      pinKey: 'out',
    };

    it('should return Either.Left for non-existent input node in the patch', () => {
      const link = {
        id: linkId,
        input: { nodeId: 'non-existent', pinKey: 'a' },
        output: validOutput,
      };
      const err = Patch.validateLink(link, patch);
      Helper.expectEitherError(
        'LINK_INPUT_NODE_NOT_FOUND {"link":{"id":"1","input":{"nodeId":"non-existent","pinKey":"a"},"output":{"nodeId":"out","pinKey":"out"}},"nodeId":"non-existent","trace":["@/default-patch-path"]}',
        err
      );
    });
    it('should return Either.Left for non-existent output node in the patch', () => {
      const link = {
        id: linkId,
        input: validInput,
        output: { nodeId: 'non-existent', pinKey: 'a' },
      };
      const err = Patch.validateLink(link, patch);
      Helper.expectEitherError(
        'LINK_OUTPUT_NODE_NOT_FOUND {"link":{"id":"1","input":{"nodeId":"in","pinKey":"in"},"output":{"nodeId":"non-existent","pinKey":"a"}},"nodeId":"in","trace":["@/default-patch-path"]}',
        err
      );
    });
    it('should return Either.Right with link', () => {
      const link = { id: linkId, input: validInput, output: validOutput };
      const valid = Patch.validateLink(link, patch);
      Helper.expectEitherRight(
        validLink => assert.equal(validLink, link),
        valid
      );
    });
  });

  // utils
  describe('utils', () => {
    describe('topology utils', () => {
      const patch = Helper.defaultizePatch({
        nodes: {
          a: { id: 'a' },
          b: { id: 'b' },
          c: { id: 'c' },
        },
        links: {
          x: {
            id: 'x',
            input: { nodeId: 'b', pinKey: 'x' },
            output: { nodeId: 'a', pinKey: 'x' },
          },
          y: {
            id: 'y',
            input: { nodeId: 'c', pinKey: 'x' },
            output: { nodeId: 'b', pinKey: 'x' },
          },
        },
        attachments: [
          Attachment.createAttachment(
            'patch.cpp',
            'utf-8',
            '// implementation'
          ),
        ],
      });
      const expectedPatch = Helper.defaultizePatch({
        nodes: {
          0: { id: '0' },
          1: { id: '1' },
          2: { id: '2' },
        },
        links: {
          x: {
            id: 'x',
            input: { nodeId: '1', pinKey: 'x' },
            output: { nodeId: '0', pinKey: 'x' },
          },
          y: {
            id: 'y',
            input: { nodeId: '2', pinKey: 'x' },
            output: { nodeId: '1', pinKey: 'x' },
          },
        },
        attachments: [
          Attachment.createAttachment(
            'patch.cpp',
            'utf-8',
            '// implementation'
          ),
        ],
      });

      it('toposortNodes: should return same patch with nodes and links with new ids', () => {
        const sortedPatch = XF.explodeEither(Patch.toposortNodes(patch));
        assert.deepEqual(sortedPatch, expectedPatch);
      });
      it('getTopology: should return correct topology', () => {
        Helper.expectEitherRight(topology => {
          assert.deepEqual(topology, ['a', 'b', 'c']);
        }, Patch.getTopology(patch));

        Helper.expectEitherRight(topology => {
          assert.deepEqual(topology, ['0', '1', '2']);
        }, Patch.getTopology(expectedPatch));
      });
    });

    describe('isEffectPatch', () => {
      it('should return true for a patch with pulse inputs', () => {
        const someLocalPatch = Helper.defaultizePatch({
          path: PPU.getLocalPath('my-patch'),
          nodes: {
            plsin: {
              type: PPU.getTerminalPath(
                CONST.PIN_DIRECTION.INPUT,
                CONST.PIN_TYPE.PULSE
              ),
            },
          },
        });
        assert.isTrue(Patch.isEffectPatch(someLocalPatch));

        const terminalPulse = Helper.defaultizePatch({
          path: PPU.getTerminalPath(
            CONST.PIN_DIRECTION.OUTPUT,
            CONST.PIN_TYPE.PULSE
          ),
        });
        assert.isTrue(Patch.isEffectPatch(terminalPulse));
      });
      it('should return true for a patch with pulse outputs', () => {
        const someLocalPatch = Helper.defaultizePatch({
          path: PPU.getLocalPath('my-patch'),
          nodes: {
            plsout: {
              type: PPU.getTerminalPath(
                CONST.PIN_DIRECTION.OUTPUT,
                CONST.PIN_TYPE.PULSE
              ),
            },
          },
        });
        assert.isTrue(Patch.isEffectPatch(someLocalPatch));

        const terminalPulse = Helper.defaultizePatch({
          path: PPU.getTerminalPath(
            CONST.PIN_DIRECTION.INPUT,
            CONST.PIN_TYPE.PULSE
          ),
        });
        assert.isTrue(Patch.isEffectPatch(terminalPulse));
      });
      it('should return false for a patch without pulse pins', () => {
        const noPinsAtAll = Helper.defaultizePatch({
          path: PPU.getLocalPath('my-patch'),
        });
        assert.isFalse(Patch.isEffectPatch(noPinsAtAll));

        const withPins = Helper.defaultizePatch({
          path: PPU.getLocalPath('my-patch'),
          nodes: {
            someInputNode: {
              type: PPU.getTerminalPath(
                CONST.PIN_DIRECTION.INPUT,
                CONST.PIN_TYPE.NUMBER
              ),
            },
            someOutputNode: {
              type: PPU.getTerminalPath(
                CONST.PIN_DIRECTION.INPUT,
                CONST.PIN_TYPE.BOOLEAN
              ),
            },
          },
        });
        assert.isFalse(Patch.isEffectPatch(withPins));
      });
    });

    describe('isDeprecatedPatch', () => {
      it('returns true for patch with deprecated marker', () => {
        const patch = Helper.defaultizePatch({
          nodes: {
            a: {
              type: 'xod/patch-nodes/deprecated',
            },
          },
        });

        assert.equal(Patch.isDeprecatedPatch(patch), true);
      });
      it('returns false for patch without deprecated marker', () => {
        const patch = Helper.defaultizePatch({});
        assert.equal(Patch.isDeprecatedPatch(patch), false);
      });
    });
    describe('getDeprecationReason', () => {
      it('returns Maybe String for patch with deprecated marker', () => {
        const patch = Helper.defaultizePatch({
          nodes: {
            a: {
              type: 'xod/patch-nodes/deprecated',
              description: 'You should not use it anymore',
            },
          },
        });

        assert.equal(
          Patch.getDeprecationReason(patch).getOrElse(null),
          'You should not use it anymore'
        );
      });
      it('returns Maybe.Nothing for patch without deprecated marker', () => {
        const patch = Helper.defaultizePatch({});
        assert.equal(Patch.getDeprecationReason(patch).isNothing, true);
      });
    });

    describe('canBindToOutputs', () => {
      it('should return true for a patch with pulse inputs', () => {
        const patch = Helper.defaultizePatch({
          path: PPU.getLocalPath('my-patch'),
          nodes: {
            plsin: {
              type: PPU.getTerminalPath(
                CONST.PIN_DIRECTION.INPUT,
                CONST.PIN_TYPE.PULSE
              ),
            },
          },
        });
        assert.isTrue(Patch.canBindToOutputs(patch));
      });
      it('should return true for a patch with pulse outputs', () => {
        const patch = Helper.defaultizePatch({
          path: PPU.getLocalPath('my-patch'),
          nodes: {
            plsout: {
              type: PPU.getTerminalPath(
                CONST.PIN_DIRECTION.OUTPUT,
                CONST.PIN_TYPE.PULSE
              ),
            },
          },
        });
        assert.isTrue(Patch.canBindToOutputs(patch));
      });
      it('should return true for constant patches', () => {
        const patch = Helper.defaultizePatch({
          path: CONST.CONST_NODETYPES[CONST.PIN_TYPE.NUMBER],
          nodes: {
            out: {
              type: PPU.getTerminalPath(
                CONST.PIN_DIRECTION.OUTPUT,
                CONST.PIN_TYPE.NUMBER
              ),
            },
          },
        });
        assert.isTrue(Patch.canBindToOutputs(patch));
      });
      it('should return true for terminal patches', () => {
        const patch = Helper.defaultizePatch({
          path: PPU.getTerminalPath(
            CONST.PIN_DIRECTION.OUTPUT,
            CONST.PIN_TYPE.NUMBER
          ),
        });
        assert.isTrue(Patch.canBindToOutputs(patch));
      });
      it('should return false for a patch without pulse pins(a.k.a functional patch)', () => {
        const patch = Helper.defaultizePatch({
          path: PPU.getLocalPath('my-patch'),
        });
        assert.isFalse(Patch.canBindToOutputs(patch));
      });
    });

    describe('remove debug nodes', () => {
      it('should return patch without debug nodes and links', () => {
        const origPatch = Helper.defaultizePatch({
          nodes: {
            a: {
              id: 'a',
              type: 'xod/core/watch',
            },
            b: {
              id: 'b',
              type: 'xod/core/add',
            },
          },
          links: {
            b2a: {
              id: 'b2a',
              input: { nodeId: 'a', pinKey: 'IN' },
              output: { nodeId: 'a', pinKey: 'OUT' },
            },
          },
        });
        const expectedPatch = Helper.defaultizePatch({
          nodes: {
            b: {
              id: 'b',
              type: 'xod/core/add',
            },
          },
          links: {},
        });

        assert.deepEqual(Patch.removeDebugNodes(origPatch), expectedPatch);
      });
      it('should not affect patch without debug nodes', () => {
        const origPatch = Helper.defaultizePatch({
          nodes: {
            a: {
              id: 'a',
              type: 'xod/core/multiply',
            },
            b: {
              id: 'b',
              type: 'xod/core/add',
            },
          },
          links: {
            b2a: {
              id: 'b2a',
              input: { nodeId: 'a', pinKey: 'IN_0' },
              output: { nodeId: 'a', pinKey: 'OUT' },
            },
          },
        });

        assert.strictEqual(Patch.removeDebugNodes(origPatch), origPatch);
      });
    });

    describe('sameNodesList', () => {
      it('returns false if Node added', () => {
        const prevPatch = Helper.defaultizePatch({ nodes: { a: {}, b: {} } });
        const nextPatch = Helper.defaultizePatch({
          nodes: {
            a: {},
            b: {},
            c: {},
          },
        });
        assert.isFalse(Patch.sameNodesList(prevPatch, nextPatch));
      });
      it('returns false if Node deleted', () => {
        const prevPatch = Helper.defaultizePatch({ nodes: { a: {}, b: {} } });
        const nextPatch = Helper.defaultizePatch({ nodes: { a: {} } });
        assert.isFalse(Patch.sameNodesList(prevPatch, nextPatch));
      });
      it('returns true if nothing changed', () => {
        const prevPatch = Helper.defaultizePatch({ nodes: { a: {}, b: {} } });
        const nextPatch = Helper.defaultizePatch({ nodes: { a: {}, b: {} } });
        assert.isTrue(Patch.sameNodesList(prevPatch, nextPatch));
      });
    });

    describe('sameCategoryMarkers', () => {
      it('returns false if Utility marker added', () => {
        const prevPatch = Helper.defaultizePatch({ nodes: { a: {}, b: {} } });
        const nextPatch = Helper.defaultizePatch({
          nodes: {
            a: {},
            b: {},
            c: { type: CONST.UTILITY_MARKER_PATH },
          },
        });
        assert.isFalse(Patch.sameCategoryMarkers(prevPatch, nextPatch));
      });
      it('returns false if Deprecated marker added', () => {
        const prevPatch = Helper.defaultizePatch({ nodes: { a: {}, b: {} } });
        const nextPatch = Helper.defaultizePatch({
          nodes: {
            a: {},
            b: {},
            c: { type: CONST.DEPRECATED_MARKER_PATH },
          },
        });
        assert.isFalse(Patch.sameCategoryMarkers(prevPatch, nextPatch));
      });
      it('returns true if no Utility/Deprecated markers added', () => {
        const prevPatch = Helper.defaultizePatch({ nodes: { a: {}, b: {} } });
        const nextPatch = Helper.defaultizePatch({
          nodes: {
            a: {},
            b: {},
            c: {},
          },
        });
        assert.isTrue(Patch.sameCategoryMarkers(prevPatch, nextPatch));
      });
      it('returns true if nothing changed', () => {
        const prevPatch = Helper.defaultizePatch({ nodes: { a: {}, b: {} } });
        const nextPatch = Helper.defaultizePatch({ nodes: { a: {}, b: {} } });
        assert.isTrue(Patch.sameCategoryMarkers(prevPatch, nextPatch));
      });
    });

    describe('sameNodeTypes', () => {
      it('returns false if some Node changed type', () => {
        const prev = Helper.defaultizePatch({
          nodes: {
            a: { type: '@/a' },
            b: { type: '@/b' },
          },
        });
        const next = Helper.defaultizePatch({
          nodes: {
            a: { type: '@/c' },
            b: { type: '@/b' },
          },
        });
        const next2 = Helper.defaultizePatch({
          nodes: {
            a: { type: '@/b' },
            b: { type: '@/b' },
          },
        });

        assert.isFalse(Patch.sameNodeTypes(prev, next));
        assert.isFalse(Patch.sameNodeTypes(prev, next2));
      });
      it('returns true for the same list of Nodes', () => {
        const prev = Helper.defaultizePatch({
          nodes: {
            a: { type: '@/a' },
            b: { type: '@/b' },
          },
        });
        const next = Helper.defaultizePatch({
          nodes: {
            a: { type: '@/a' },
            b: { type: '@/b' },
          },
        });

        assert.isTrue(Patch.sameNodeTypes(prev, next));
      });
    });

    describe('sameNodeBoundValues', () => {
      it('returns false if some Nodes changed bound values', () => {
        const prev = Helper.defaultizePatch({
          nodes: {
            a: { boundLiterals: { aaa: '123', bbb: '321' } },
            b: { boundLiterals: { xxx: '"lala"', yyy: 'Never' } },
          },
        });
        const next = R.assocPath(
          ['nodes', 'a', 'boundLiterals', 'aaa'],
          '42.5',
          prev
        );

        assert.isFalse(Patch.sameNodeBoundValues(prev, next));
      });
      it('returns true if no bound values changed', () => {
        const prev = Helper.defaultizePatch({
          nodes: {
            a: { boundLiterals: { aaa: '123', bbb: '321' } },
            b: { boundLiterals: { xxx: '"lala"', yyy: 'Never' } },
          },
        });

        assert.isTrue(Patch.sameNodeBoundValues(prev, prev));
      });
    });
  });

  // variadics
  describe('variadic utils', () => {
    describe('isVariadicPatch', () => {
      it('returns false for Patch without variadic markers', () => {
        const patch = Helper.defaultizePatch({
          nodes: {
            a: {
              id: 'a',
              type: 'xod/core/add',
            },
          },
        });

        assert.equal(Patch.isVariadicPatch(patch), false);
      });
      it('returns false for Patch with not valid variadic marker', () => {
        const patch = Helper.defaultizePatch({
          nodes: {
            a: {
              id: 'a',
              type: 'xod/patch-nodes/variadic-99',
            },
          },
        });

        assert.equal(Patch.isVariadicPatch(patch), false);
      });
      it('returns true for Patch with valid variadic marker', () => {
        const patch = Helper.defaultizePatch({
          nodes: {
            a: {
              id: 'a',
              type: 'xod/patch-nodes/variadic-2',
            },
          },
        });

        assert.equal(Patch.isVariadicPatch(patch), true);
      });
    });

    describe('getArityStepFromPatch', () => {
      it('returns Nothing for patch without variadic Node', () => {
        const patch = Helper.defaultizePatch({});
        assert.equal(Patch.getArityStepFromPatch(patch).isNothing, true);
      });
      it('returns Nothing for patch with wrong kind of variadic Node', () => {
        const patch = Helper.defaultizePatch({
          nodes: {
            a: {
              id: 'a',
              type: 'xod/patch-nodes/variadic-99',
            },
          },
        });
        assert.equal(Patch.getArityStepFromPatch(patch).isNothing, true);
      });

      const createTestForJust = n => {
        it(`returns Maybe ${n} for patch with variadic Node`, () => {
          const patch = Helper.defaultizePatch({
            nodes: {
              a: {
                id: 'a',
                type: `xod/patch-nodes/variadic-${n}`,
              },
            },
          });
          assert.equal(Patch.getArityStepFromPatch(patch).getOrElse(null), n);
        });
      };

      createTestForJust(1);
      createTestForJust(2);
      createTestForJust(3);
    });

    describe('computeVariadicPins', () => {
      it('returns Either.Left Error for Patch without variadic markers', () => {
        const patch = Helper.defaultizePatch({
          path: '@/test',
        });
        const res = Patch.computeVariadicPins(patch);
        Helper.expectEitherError(
          'NO_VARIADIC_MARKERS {"trace":["@/test"]}',
          res
        );
      });
      it('returns Either.Left Error for Patch with >1 variadic marker', () => {
        const patch = Helper.defaultizePatch({
          path: '@/test',
          nodes: {
            a: {
              id: 'a',
              type: 'xod/patch-nodes/variadic-1',
            },
            b: {
              id: 'b',
              type: 'xod/patch-nodes/variadic-1',
            },
          },
        });
        const res = Patch.computeVariadicPins(patch);

        Helper.expectEitherError(
          'TOO_MANY_VARIADIC_MARKERS {"trace":["@/test"]}',
          res
        );
      });
      it('returns Either.Left Error for patch with variadic marker and without output pins', () => {
        const patch = Helper.defaultizePatch({
          nodes: {
            a: {
              id: 'a',
              type: 'xod/patch-nodes/variadic-2',
            },
          },
        });
        const res = Patch.computeVariadicPins(patch);

        Helper.expectEitherError(
          'VARIADIC_HAS_NO_OUTPUTS {"trace":["@/default-patch-path"]}',
          res
        );
      });
      it('returns Either.Left Error for patch with variadic marker and with less inputs than needed', () => {
        const patch = Helper.defaultizePatch({
          nodes: {
            a: {
              id: 'a',
              type: 'xod/patch-nodes/variadic-2',
            },
            b: {
              id: 'b',
              type: 'xod/patch-nodes/input-number',
            },
            d: {
              id: 'd',
              type: 'xod/patch-nodes/output-number',
            },
          },
        });
        const res = Patch.computeVariadicPins(patch);

        Helper.expectEitherError(
          'NOT_ENOUGH_VARIADIC_INPUTS {"trace":["@/default-patch-path"],"arityStep":2,"outputCount":1,"minInputs":3}',
          res
        );
      });
      it('returns Either.Left Error for patch with different types of output pins and accumulator input pins', () => {
        const patch = Helper.defaultizePatch({
          nodes: {
            a: {
              id: 'a',
              type: 'xod/patch-nodes/variadic-2',
            },
            b: {
              id: 'b',
              label: 'X',
              type: 'xod/patch-nodes/input-number',
            },
            c: {
              id: 'c',
              label: 'Y',
              type: 'xod/patch-nodes/input-number',
            },
            d: {
              id: 'd',
              label: 'ADD',
              type: 'xod/patch-nodes/input-number',
            },
            e: {
              id: 'e',
              label: 'ADD2',
              type: 'xod/patch-nodes/input-number',
            },
            f: {
              id: 'f',
              label: 'A',
              type: 'xod/patch-nodes/output-number',
            },
            g: {
              id: 'g',
              label: 'B',
              type: 'xod/patch-nodes/output-boolean',
            },
          },
        });
        const res = Patch.computeVariadicPins(patch);

        Helper.expectEitherError(
          'WRONG_VARIADIC_PIN_TYPES {"trace":["@/default-patch-path"],"accPinLabels":["Y"],"outPinLabels":["B"]}',
          res
        );
      });
      it('returns Either.Right VariadicPins for patch with variadic marker and correct amount of pins', () => {
        const patch = Helper.defaultizePatch({
          nodes: {
            a: {
              id: 'a',
              type: 'xod/patch-nodes/variadic-2',
            },
            b: {
              id: 'b',
              type: 'xod/patch-nodes/input-number',
              position: { x: 0, y: 0 },
            },
            c: {
              id: 'c',
              type: 'xod/patch-nodes/input-number',
              position: { x: 10, y: 0 },
            },
            d: {
              id: 'd',
              type: 'xod/patch-nodes/input-number',
              position: { x: 20, y: 0 },
            },
            e: {
              id: 'e',
              type: 'xod/patch-nodes/output-number',
            },
          },
        });
        const res = Patch.computeVariadicPins(patch);

        assert.equal(res.isRight, true);
        const resPins = XF.explodeEither(res);
        assert.equal(resPins.value[0].key, 'c');
        assert.equal(resPins.value[1].key, 'd');
        assert.equal(resPins.acc[0].key, 'b');
        assert.equal(resPins.outputs[0].key, 'e');

        assert.lengthOf(resPins.shared, 0);
      });
      it('returns Either.Right VariadicPins with shared pins', () => {
        const patch = Helper.defaultizePatch({
          nodes: {
            a: {
              id: 'a',
              type: 'xod/patch-nodes/variadic-1',
            },
            b: {
              id: 'b',
              type: 'xod/patch-nodes/input-number',
              position: { x: 0, y: 0 },
            },
            c: {
              id: 'c',
              type: 'xod/patch-nodes/input-number',
              position: { x: 10, y: 0 },
            },
            d: {
              id: 'd',
              type: 'xod/patch-nodes/input-number',
              position: { x: 20, y: 0 },
            },
            e: {
              id: 'e',
              type: 'xod/patch-nodes/output-number',
            },
          },
        });
        const res = Patch.computeVariadicPins(patch);

        assert.equal(res.isRight, true);
        const resPins = XF.explodeEither(res);
        assert.equal(resPins.value[0].key, 'd');
        assert.equal(resPins.acc[0].key, 'c');
        assert.equal(resPins.shared[0].key, 'b');
        assert.equal(resPins.outputs[0].key, 'e');
      });
    });
  });

  describe('abstract patches', () => {
    describe('validateAbstractPatch', () => {
      it('should ignore regular patches', () => {
        const patch = Helper.defaultizePatch({
          nodes: {
            foo: {
              type: PPU.getLocalPath('whatever'),
            },
          },
        });

        Helper.expectEitherRight(
          R.equals(patch),
          Patch.validateAbstractPatch(patch)
        );
      });

      it('should check that abstract patches have generic inputs', () => {
        const patch = Helper.defaultizePatch({
          nodes: {
            a: {
              type: CONST.ABSTRACT_MARKER_PATH,
            },
          },
        });

        Helper.expectEitherError(
          'GENERIC_TERMINALS_REQUIRED {"trace":["@/default-patch-path"]}',
          Patch.validateAbstractPatch(patch)
        );
      });

      it('should check that generic terminals are used sequentually', () => {
        const patch = Helper.defaultizePatch({
          nodes: {
            a: {
              type: CONST.ABSTRACT_MARKER_PATH,
            },
            b: {
              type: PPU.getTerminalPath(
                CONST.PIN_DIRECTION.INPUT,
                CONST.PIN_TYPE.T1
              ),
            },
            c: {
              type: PPU.getTerminalPath(
                CONST.PIN_DIRECTION.INPUT,
                CONST.PIN_TYPE.T3
              ),
            },
          },
        });

        Helper.expectEitherError(
          'NONSEQUENTIAL_GENERIC_TERMINALS {"types":["t1","t2"],"trace":["@/default-patch-path"]}',
          Patch.validateAbstractPatch(patch)
        );
      });

      it('should check that for all generic outputs we have inputs with the same type', () => {
        const patch = Helper.defaultizePatch({
          nodes: {
            'input-t1': {
              type: PPU.getTerminalPath(
                CONST.PIN_DIRECTION.INPUT,
                CONST.PIN_TYPE.T1
              ),
            },
            'output-t2': {
              type: PPU.getTerminalPath(
                CONST.PIN_DIRECTION.OUTPUT,
                CONST.PIN_TYPE.T2
              ),
            },
            'abstract-marker': {
              type: CONST.ABSTRACT_MARKER_PATH,
            },
          },
        });

        Helper.expectEitherError(
          'ORPHAN_GENERIC_OUTPUTS {"trace":["@/default-patch-path"],"types":["t2"]}',
          Patch.validateAbstractPatch(patch)
        );
      });

      it('should ignore the order in which terminals are created', () => {
        const patch = Helper.defaultizePatch({
          nodes: {
            // note that input-t2 is defined first
            'input-t2': {
              type: PPU.getTerminalPath(
                CONST.PIN_DIRECTION.INPUT,
                CONST.PIN_TYPE.T2
              ),
            },
            'input-t1': {
              type: PPU.getTerminalPath(
                CONST.PIN_DIRECTION.INPUT,
                CONST.PIN_TYPE.T1
              ),
            },
            'abstract-marker': {
              type: CONST.ABSTRACT_MARKER_PATH,
            },
          },
        });

        Helper.expectEitherRight(
          R.equals(patch),
          Patch.validateAbstractPatch(patch)
        );
      });
    });

    describe('checkSpecializationMatchesAbstraction', () => {
      const abstractPatch = Helper.createAbstractPatch(
        ['t1', 'boolean', 't2'],
        ['t1', 'pulse']
      );

      it('should check that specialization patch is not abstract', () => {
        Helper.expectEitherError(
          'SPECIALIZATION_PATCH_CANT_BE_ABSTRACT {}',
          Patch.checkSpecializationMatchesAbstraction(
            abstractPatch,
            abstractPatch
          )
        );
      });

      it('should check that specialization patch does not have generic pins', () => {
        Helper.expectEitherError(
          'SPECIALIZATION_PATCH_CANT_HAVE_GENERIC_PINS {}',
          Patch.checkSpecializationMatchesAbstraction(
            abstractPatch,
            Helper.createSpecializationPatch(
              ['t1', 'boolean', 'string'],
              ['number', 'pulse']
            )
          )
        );
      });

      it('should check that patches have equal number of inputs and outputs', () => {
        Helper.expectEitherError(
          'SPECIALIZATION_PATCH_MUST_HAVE_N_INPUTS {"desiredInputsNumber":3,"abstractPatchPath":"@/default-patch-path"}',
          Patch.checkSpecializationMatchesAbstraction(
            abstractPatch,
            Helper.createSpecializationPatch(
              ['number', 'boolean'],
              ['number', 'pulse']
            )
          )
        );

        Helper.expectEitherError(
          'SPECIALIZATION_PATCH_MUST_HAVE_N_OUTPUTS {"desiredOutputsNumber":2,"abstractPatchPath":"@/default-patch-path"}',
          Patch.checkSpecializationMatchesAbstraction(
            abstractPatch,
            Helper.createSpecializationPatch(
              ['number', 'boolean', 'string'],
              ['number']
            )
          )
        );
      });

      it('should check that static pins match', () => {
        Helper.expectEitherError(
          'SPECIALIZATION_STATIC_PINS_DO_NOT_MATCH {"abstractPatchPath":"@/default-patch-path"}',
          Patch.checkSpecializationMatchesAbstraction(
            abstractPatch,
            Helper.createSpecializationPatch(
              ['number', 'string', 'string'],
              ['number', 'pulse']
            )
          )
        );

        Helper.expectEitherError(
          'SPECIALIZATION_STATIC_PINS_DO_NOT_MATCH {"abstractPatchPath":"@/default-patch-path"}',
          Patch.checkSpecializationMatchesAbstraction(
            abstractPatch,
            Helper.createSpecializationPatch(
              ['number', 'boolean', 'string'],
              ['number', 'string']
            )
          )
        );
      });

      it('should check constrains for generic pins', () => {
        Helper.expectEitherError(
          'SPECIALIZATION_HAS_CONFLICTING_TYPES_FOR_GENERIC {"genericType":"t1","typeNames":"string, number","abstractPatchPath":"@/default-patch-path"}',
          Patch.checkSpecializationMatchesAbstraction(
            abstractPatch,
            Helper.createSpecializationPatch(
              ['string', 'boolean', 'string'],
              ['number', 'pulse']
            )
          )
        );

        Helper.expectEitherError(
          'SPECIALIZATION_HAS_CONFLICTING_TYPES_FOR_GENERIC {"genericType":"t1","typeNames":"number, string","abstractPatchPath":"@/default-patch-path"}',
          Patch.checkSpecializationMatchesAbstraction(
            abstractPatch,
            Helper.createSpecializationPatch(
              ['number', 'boolean', 'string'],
              ['string', 'pulse']
            )
          )
        );
      });

      it('should check patch basename', () => {
        Helper.expectEitherError(
          'SPECIALIZATION_HAS_WRONG_NAME {"expectedSpecializationBaseName":"default-patch-path(number,string)","abstractPatchPath":"@/default-patch-path"}',
          Patch.checkSpecializationMatchesAbstraction(
            abstractPatch,
            Helper.createSpecializationPatch(
              ['number', 'boolean', 'string'],
              ['number', 'pulse']
            )
          )
        );
      });

      it('should leave valid patch untouched', () => {
        const validSpecializationPatch = Patch.setPatchPath(
          '@/default-patch-path(number,string)',
          Helper.createSpecializationPatch(
            ['number', 'boolean', 'string'],
            ['number', 'pulse']
          )
        );

        Helper.expectEitherRight(
          R.equals(validSpecializationPatch),
          Patch.checkSpecializationMatchesAbstraction(
            abstractPatch,
            validSpecializationPatch
          )
        );
      });
    });
  });

  describe('constructor patches', () => {
    describe('validateConstructorPatch', () => {
      it('should ignore regular patches', () => {
        const patch = Helper.defaultizePatch({
          nodes: {
            foo: {
              type: PPU.getLocalPath('whatever'),
            },
          },
        });

        Helper.expectEitherRight(
          R.equals(patch),
          Patch.validateConstructorPatch(patch)
        );
      });

      it('should check that constructor patch has no generic pins', () => {
        const constructorPatchWithGenericInput = Helper.defaultizePatch({
          nodes: {
            outSelf: {
              type: CONST.OUTPUT_SELF_PATH,
            },
            genIn: {
              type: PPU.getTerminalPath(
                CONST.PIN_DIRECTION.INPUT,
                CONST.PIN_TYPE.T1
              ),
            },
          },
        });

        Helper.expectEitherError(
          'CONSTRUCTOR_PATCH_CANT_HAVE_GENERIC_PINS {"trace":["@/default-patch-path"]}',
          Patch.validateConstructorPatch(constructorPatchWithGenericInput)
        );

        const constructorPatchWithGenericOutput = Helper.defaultizePatch({
          nodes: {
            outSelf: {
              type: CONST.OUTPUT_SELF_PATH,
            },
            genOut: {
              type: PPU.getTerminalPath(
                CONST.PIN_DIRECTION.OUTPUT,
                CONST.PIN_TYPE.T1
              ),
            },
          },
        });

        Helper.expectEitherError(
          'CONSTRUCTOR_PATCH_CANT_HAVE_GENERIC_PINS {"trace":["@/default-patch-path"]}',
          Patch.validateConstructorPatch(constructorPatchWithGenericOutput)
        );
      });

      it('should check that constructor patch has a C++ implementation', () => {
        const constructorPatchWithoutCppImpl = Helper.defaultizePatch({
          nodes: {
            outSelf: {
              type: CONST.OUTPUT_SELF_PATH,
            },
          },
        });

        Helper.expectEitherError(
          'CONSTRUCTOR_PATCH_MUST_BE_NIIX {"trace":["@/default-patch-path"]}',
          Patch.validateConstructorPatch(constructorPatchWithoutCppImpl)
        );

        const constructorPatchWithCppImpl = Helper.defaultizePatch({
          nodes: {
            outSelf: {
              type: CONST.OUTPUT_SELF_PATH,
            },
            impl: {
              type: CONST.NOT_IMPLEMENTED_IN_XOD_PATH,
            },
          },
        });

        Helper.expectEitherRight(
          R.equals(constructorPatchWithCppImpl),
          Patch.validateConstructorPatch(constructorPatchWithCppImpl)
        );
      });
    });
  });
});
