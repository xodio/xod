import R from 'ramda';
import chai, { expect, assert } from 'chai';
import dirtyChai from 'dirty-chai';
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

chai.use(dirtyChai);

const emptyPatch = Helper.defaultizePatch({});

describe('Patch', () => {
  // constructors
  describe('createPatch', () => {
    it('should return Patch that is an object', () => {
      const patch = Patch.createPatch();

      expect(patch).is.an('object');
    });
    it('should have key: nodes === {}', () => {
      const patch = Patch.createPatch();

      expect(patch)
        .to.have.property('nodes')
        .that.is.an('object')
        .that.is.empty();
    });
    it('should have key: links === {}', () => {
      const patch = Patch.createPatch();

      expect(patch)
        .to.have.property('links')
        .that.is.an('object')
        .that.is.empty();
    });
  });
  describe('duplicatePatch', () => {
    const patch = Helper.defaultizePatch({ nodes: {}, label: 'test' });
    it('should return new patch (not the same object)', () => {
      const newPatch = Patch.duplicatePatch(patch);
      expect(newPatch)
        .to.be.an('object')
        .and.not.to.be.equal(patch);
    });
    it('should be deeply cloned (not the same nested objects)', () => {
      const newPatch = Patch.duplicatePatch(patch);
      expect(newPatch)
        .have.property('label')
        .that.equal(patch.label);
      expect(newPatch)
        .have.property('nodes')
        .that.not.equal(patch.nodes);
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
      expect(Patch.isTerminalPatch(emptyPatch)).to.be.false();
    });
    it('should return false for patch without terminal pin', () => {
      const patch = Helper.defaultizePatch({});
      expect(Patch.isTerminalPatch(patch)).to.be.false();
    });
    it('should return true for input terminal', () => {
      const patch = Helper.defaultizePatch({
        path: 'xod/patch-nodes/input-number',
      });
      expect(Patch.isTerminalPatch(patch)).to.be.true();
    });
    it('should return true for output terminal', () => {
      const patch = Helper.defaultizePatch({
        path: 'xod/patch-nodes/output-number',
      });
      expect(Patch.isTerminalPatch(patch)).to.be.true();
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
      expect(Patch.listNodes(emptyPatch))
        .to.be.instanceof(Array)
        .to.be.empty();
    });
    it('should return an array of nodes', () => {
      expect(Patch.listNodes(patch))
        .to.be.instanceof(Array)
        .to.have.members([patch.nodes.rndId, patch.nodes.rndId2]);
    });
  });
  describe('nodeIdEquals', () => {
    it('should return false for not equal ids', () => {
      expect(Patch.nodeIdEquals('1', '2')).to.be.false();
      expect(Patch.nodeIdEquals('1', { id: '2' })).to.be.false();
    });
    it('should return true for equal ids', () => {
      expect(Patch.nodeIdEquals('1', '1')).to.be.true();
      expect(Patch.nodeIdEquals('1', { id: '1' })).to.be.true();
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
      expect(maybeNode.isNothing).to.be.true();
    });
    it('should Maybe.Just with node for existent node', () => {
      expect(Patch.getNodeById('rndId', patch).isJust).to.be.true();
      expect(Patch.getNodeById('rndId', patch).getOrElse(null)).to.be.equal(
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
      const fn = () => Patch.getNodeByIdUnsafe(nodeId, patch);
      expect(fn).to.throw(
        Error,
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
      expect(Patch.listLinks(emptyPatch))
        .to.be.instanceof(Array)
        .to.be.empty();
    });
    it('should return an array of links', () => {
      expect(Patch.listLinks(patch))
        .to.be.instanceof(Array)
        .to.have.members([patch.links['1'], patch.links['2']]);
    });
  });
  describe('linkIdEquals', () => {
    it('should return false for not equal ids', () => {
      expect(Patch.linkIdEquals('1', '2')).to.be.false();
      expect(Patch.linkIdEquals('1', { id: '2' })).to.be.false();
    });
    it('should return true for equal ids', () => {
      expect(Patch.linkIdEquals('1', '1')).to.be.true();
      expect(Patch.linkIdEquals('1', { id: '1' })).to.be.true();
    });
  });
  describe('getLinkById', () => {
    const patch = Helper.defaultizePatch({
      links: {
        1: { id: '1' },
      },
    });

    it('should Maybe.Nothing for non-existent link', () => {
      expect(
        Patch.getLinkById('non-existent', emptyPatch).isNothing
      ).to.be.true();
    });
    it('should Maybe.Just with link for existent link', () => {
      expect(Patch.getLinkById('1', patch).isJust).to.be.true();
      expect(Patch.getLinkById('1', patch).getOrElse(null)).to.be.equal(
        patch.links[1]
      );
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
      expect(Patch.listLinksByNode('@/non-existent', patch))
        .to.be.instanceof(Array)
        .and.to.be.empty();
    });
    it('should return empty array for empty patch', () => {
      expect(Patch.listLinksByNode('@/a', emptyPatch))
        .to.be.instanceof(Array)
        .and.to.be.empty();
    });
    it('should return array with one link', () => {
      expect(Patch.listLinksByNode('@/from', patch))
        .to.be.instanceof(Array)
        .and.to.have.members([patch.links[1]]);
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
      expect(Patch.listLinksByPin('fromPin', '@/non-existent', patch))
        .to.be.instanceof(Array)
        .and.to.be.empty();
    });
    it('should return empty array for empty patch', () => {
      expect(Patch.listLinksByPin('fromPin', '@/from', emptyPatch))
        .to.be.instanceof(Array)
        .and.to.be.empty();
    });
    it('should return empty array for pinKey in input and nodeId in output', () => {
      expect(Patch.listLinksByPin('fromPin', '@/to', patch))
        .to.be.instanceof(Array)
        .and.to.be.empty();
    });
    it('should return array with one link', () => {
      expect(Patch.listLinksByPin('fromPin', '@/from', patch))
        .to.be.instanceof(Array)
        .and.to.have.members([patch.links[1]]);
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
        defaultValue: false,
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
        defaultValue: false,
        isBindable: false,
      },
    };

    describe('getPinByKey', () => {
      it('should return Maybe.Nothing for empty patch', () => {
        const res = Patch.getPinByKey('a', emptyPatch);
        expect(res.isNothing).to.be.true();
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
        const res = Patch.getPinByKey('a', aPatch);
        expect(res.isJust).to.be.true();
        expect(res.getOrElse(null))
          .to.be.an('object')
          .that.have.property('key')
          .that.equal('a');
      });
    });
    describe('listPins', () => {
      it('should return empty array for empty patch', () => {
        expect(Patch.listPins(emptyPatch))
          .to.be.instanceof(Array)
          .and.to.be.empty();
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
        expect(Patch.listInputPins(emptyPatch))
          .to.be.instanceof(Array)
          .and.to.be.empty();
      });
      it('should return array with one pin', () => {
        assert.sameDeepMembers([expectedPins.in], Patch.listInputPins(patch));
      });
    });
    describe('listOutputPins', () => {
      it('should return empty array for empty patch', () => {
        expect(Patch.listOutputPins(emptyPatch))
          .to.be.instanceof(Array)
          .and.to.be.empty();
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
              boundValues: {
                [CONST.TERMINAL_PIN_KEYS[CONST.PIN_DIRECTION.OUTPUT]]: 'hello',
              },
            },
            outNum: {
              type: PPU.getTerminalPath(
                CONST.PIN_DIRECTION.OUTPUT,
                CONST.PIN_TYPE.NUMBER
              ),
              boundValues: {
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
              boundValues: {},
            },
            outNum: {
              type: PPU.getTerminalPath(
                CONST.PIN_DIRECTION.OUTPUT,
                CONST.PIN_TYPE.NUMBER
              ),
              boundValues: {},
            },
          },
        });

        const pinDefaultValues = R.compose(
          R.map(Pin.getPinDefaultValue),
          R.indexBy(Pin.getPinKey),
          Patch.listPins
        )(testPatch);

        assert.deepEqual({ inStr: '', outNum: 0 }, pinDefaultValues);
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

      expect(newPatch)
        .to.have.property('nodes')
        .to.have.property('1')
        .that.equals(node);
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

      expect(newPatch)
        .to.have.property('nodes')
        .to.have.property('1')
        .that.equals(node);
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
        0
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
        ''
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
        0
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

      expect(newPatch)
        .to.be.an('object')
        .that.have.property('nodes')
        .that.not.have.keys(['rndId']);
    });
    it('should remove node by Node object', () => {
      const node = patch.nodes.rndId;
      const newPatch = Patch.dissocNode(node, patch);

      expect(newPatch)
        .to.be.an('object')
        .that.have.property('nodes')
        .that.not.have.keys(['rndId']);
    });
    it('should remove connected link', () => {
      const node = patch.nodes.rndId;
      const newPatch = Patch.dissocNode(node, patch);

      expect(newPatch)
        .to.be.an('object')
        .that.have.property('links')
        .that.empty();
    });
    it('should not affect on other nodes', () => {
      const newPatch = Patch.dissocNode('rndId', patch);

      expect(newPatch)
        .to.be.an('object')
        .that.have.property('nodes')
        .that.have.keys(['rndId2'])
        .and.not.have.keys(['rndId']);
    });
    it('should return unchanges Patch for non-existent node/id', () => {
      expect(Patch.dissocNode('@/non-existent', patch))
        .to.be.an('object')
        .and.deep.equals(patch);
      expect(Patch.dissocNode({ id: '@/non-existent' }, patch))
        .to.be.an('object')
        .and.deep.equals(patch);
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

      expect(newPatch)
        .to.be.an('object')
        .that.have.property('links')
        .that.not.have.keys(['1']);
    });
    it('should remove node by Link object', () => {
      const link = patch.links['1'];
      const newPatch = Patch.dissocLink(link, patch);

      expect(newPatch)
        .to.be.an('object')
        .that.have.property('links')
        .that.not.have.keys(['1']);
    });
    it('should not affect on other links', () => {
      const newPatch = Patch.dissocLink('1', patch);

      expect(newPatch)
        .to.be.an('object')
        .that.have.property('links')
        .that.have.keys(['2'])
        .and.not.have.keys(['1']);
    });
    it('should return unchanges Patch for non-existent link/id', () => {
      expect(Patch.dissocLink('3', patch))
        .to.be.an('object')
        .and.deep.equals(patch);
      expect(Patch.dissocLink({ id: '3' }, patch))
        .to.be.an('object')
        .and.deep.equals(patch);
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
        validLink => expect(validLink).to.be.equal(link),
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
          expect(topology).to.be.deep.equal(['a', 'b', 'c']);
        }, Patch.getTopology(patch));

        Helper.expectEitherRight(topology => {
          expect(topology).to.be.deep.equal(['0', '1', '2']);
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
        expect(Patch.isEffectPatch(someLocalPatch)).to.be.true();

        const terminalPulse = Helper.defaultizePatch({
          path: PPU.getTerminalPath(
            CONST.PIN_DIRECTION.OUTPUT,
            CONST.PIN_TYPE.PULSE
          ),
        });
        expect(Patch.isEffectPatch(terminalPulse)).to.be.true();
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
        expect(Patch.isEffectPatch(someLocalPatch)).to.be.true();

        const terminalPulse = Helper.defaultizePatch({
          path: PPU.getTerminalPath(
            CONST.PIN_DIRECTION.INPUT,
            CONST.PIN_TYPE.PULSE
          ),
        });
        expect(Patch.isEffectPatch(terminalPulse)).to.be.true();
      });
      it('should return false for a patch without pulse pins', () => {
        const noPinsAtAll = Helper.defaultizePatch({
          path: PPU.getLocalPath('my-patch'),
        });
        expect(Patch.isEffectPatch(noPinsAtAll)).to.be.false();

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
        expect(Patch.isEffectPatch(withPins)).to.be.false();
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
        expect(Patch.canBindToOutputs(patch)).to.be.true();
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
        expect(Patch.canBindToOutputs(patch)).to.be.true();
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
        expect(Patch.canBindToOutputs(patch)).to.be.true();
      });
      it('should return true for terminal patches', () => {
        const patch = Helper.defaultizePatch({
          path: PPU.getTerminalPath(
            CONST.PIN_DIRECTION.OUTPUT,
            CONST.PIN_TYPE.NUMBER
          ),
        });
        expect(Patch.canBindToOutputs(patch)).to.be.true();
      });
      it('should return false for a patch without pulse pins(a.k.a functional patch)', () => {
        const patch = Helper.defaultizePatch({
          path: PPU.getLocalPath('my-patch'),
        });
        expect(Patch.canBindToOutputs(patch)).to.be.false();
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
          'NOT_ENOUGH_VARIADIC_INPUTS {"trace":["@/default-patch-path"],"arityStep":2,"outputsCount":1,"minInputs":3}',
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

  describe('getPatchSignature', () => {
    it('gets patch signature', () => {
      const patch = Helper.defaultizePatch({
        nodes: {
          niix: {
            type: CONST.NOT_IMPLEMENTED_IN_XOD_PATH,
          },
          input1: {
            type: PPU.getTerminalPath(
              CONST.PIN_DIRECTION.INPUT,
              CONST.PIN_TYPE.NUMBER
            ),
            position: { x: 0, y: 0 },
          },
          input2: {
            type: PPU.getTerminalPath(
              CONST.PIN_DIRECTION.INPUT,
              CONST.PIN_TYPE.BOOLEAN
            ),
            position: { x: 1, y: 0 },
          },
          input3: {
            type: PPU.getTerminalPath(
              CONST.PIN_DIRECTION.INPUT,
              CONST.PIN_TYPE.STRING
            ),
            position: { x: 2, y: 0 },
          },
          output1: {
            type: PPU.getTerminalPath(
              CONST.PIN_DIRECTION.OUTPUT,
              CONST.PIN_TYPE.NUMBER
            ),
          },
          output2: {
            type: PPU.getTerminalPath(
              CONST.PIN_DIRECTION.OUTPUT,
              CONST.PIN_TYPE.PULSE
            ),
            position: { x: 1, y: 1 },
          },
        },
      });

      assert.deepEqual(
        {
          [CONST.PIN_DIRECTION.INPUT]: {
            0: CONST.PIN_TYPE.NUMBER,
            1: CONST.PIN_TYPE.BOOLEAN,
            2: CONST.PIN_TYPE.STRING,
          },
          [CONST.PIN_DIRECTION.OUTPUT]: {
            0: CONST.PIN_TYPE.NUMBER,
            1: CONST.PIN_TYPE.PULSE,
          },
        },
        Patch.getPatchSignature(patch)
      );
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
          'SPECIALIZATION_PATCH_MUST_HAVE_N_INPUTS {"desiredInputsNumber":3}',
          Patch.checkSpecializationMatchesAbstraction(
            abstractPatch,
            Helper.createSpecializationPatch(
              ['number', 'boolean'],
              ['number', 'pulse']
            )
          )
        );

        Helper.expectEitherError(
          'SPECIALIZATION_PATCH_MUST_HAVE_N_OUTPUTS {"desiredOutputsNumber":2}',
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
          'SPECIALIZATION_STATIC_PINS_DO_NOT_MATCH {}',
          Patch.checkSpecializationMatchesAbstraction(
            abstractPatch,
            Helper.createSpecializationPatch(
              ['number', 'string', 'string'],
              ['number', 'pulse']
            )
          )
        );

        Helper.expectEitherError(
          'SPECIALIZATION_STATIC_PINS_DO_NOT_MATCH {}',
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
          'SPECIALIZATION_HAS_CONFLICTING_TYPES_FOR_GENERIC {"genericType":"t1","typeNames":"string, number"}',
          Patch.checkSpecializationMatchesAbstraction(
            abstractPatch,
            Helper.createSpecializationPatch(
              ['string', 'boolean', 'string'],
              ['number', 'pulse']
            )
          )
        );

        Helper.expectEitherError(
          'SPECIALIZATION_HAS_CONFLICTING_TYPES_FOR_GENERIC {"genericType":"t1","typeNames":"number, string"}',
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
          'SPECIALIZATION_HAS_WRONG_NAME {"expectedSpecializationBaseName":"default-patch-path(number,string)"}',
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
});
