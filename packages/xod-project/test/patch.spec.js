import R from 'ramda';
import chai, { expect, assert } from 'chai';
import dirtyChai from 'dirty-chai';

import * as Pin from '../src/pin';
import * as Patch from '../src/patch';
import * as CONST from '../src/constants';
import { formatString } from '../src/utils';
import * as PPU from '../src/patchPathUtils';

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

  describe('listImpls', () => {
    it('should return empty array for empty patch', () => {
      expect(Patch.listImpls(emptyPatch))
        .to.be.instanceof(Array)
        .to.be.empty();
    });
    it('should return array with keys: `js`, `espruino`', () => {
      const patch = Helper.defaultizePatch({
        impls: {
          js: '',
          espruino: '',
        },
      });
      expect(Patch.listImpls(patch))
        .to.be.an('array')
        .to.have.members(['js', 'espruino']);
    });
  });
  describe('hasImpls', () => {
    it('should return false for empty', () => {
      expect(Patch.hasImpls(['js'], emptyPatch)).to.be.false();
    });
    it('should return false if impl not found', () => {
      const patch = Helper.defaultizePatch({
        impls: {
          js: '//ok',
        },
      });
      expect(Patch.hasImpls(['cpp'], patch)).to.be.false();
    });
    it('should return true for the only correct impl', () => {
      const patch = Helper.defaultizePatch({
        impls: {
          js: '//ok',
        },
      });
      expect(Patch.hasImpls(['js'], patch)).to.be.true();
    });
    it('should return true for a few existent impls', () => {
      const patch = Helper.defaultizePatch({
        impls: {
          js: '//ok',
          nodejs: '//ok',
        },
      });
      expect(Patch.hasImpls(['js', 'nodejs'], patch)).to.be.true();
    });
  });
  describe('getImpl', () => {
    it('should return Nothing for empty patch', () => {
      const impl = Patch.getImpl('js', emptyPatch);
      expect(impl.isNothing).to.be.true();
    });
    it('should return Nothing for patch without defined impl', () => {
      const patch = Helper.defaultizePatch({ impls: { cpp: '//ok' } });
      const impl = Patch.getImpl('js', patch);
      expect(impl.isNothing).to.be.true();
    });
    it('should return Maybe with implementation for patch with defined impl', () => {
      const patch = Helper.defaultizePatch({ impls: { cpp: '//ok' } });
      const impl = Patch.getImpl('cpp', patch);
      expect(impl.isJust).to.be.true();
      expect(impl.getOrElse(null)).to.be.equal('//ok');
    });
  });
  describe('getImplByArray', () => {
    it('should return Nothing for empty patch', () => {
      const impl = Patch.getImplByArray(['js', 'nodejs'], emptyPatch);
      expect(impl.isNothing).to.be.true();
    });
    it('should return Nothing for patch without defined impl', () => {
      const patch = Helper.defaultizePatch({ impls: { cpp: '//ok' } });
      const impl = Patch.getImplByArray(['js', 'nodejs'], patch);
      expect(impl.isNothing).to.be.true();
    });
    it('should return Maybe with implementation (correct priority)', () => {
      const getJsOrNode = Patch.getImplByArray(['js', 'nodejs']);

      const jsAndNodePatch = Helper.defaultizePatch({
        impls: { js: '//js', nodejs: '//node' },
      });

      const nodeOnlyPatch = Helper.defaultizePatch({
        impls: { nodejs: '//node' },
      });

      const js = getJsOrNode(jsAndNodePatch);
      expect(js.isJust).to.be.true();
      expect(js.getOrElse(null)).to.be.equal('//js');

      const node = getJsOrNode(nodeOnlyPatch);
      expect(node.isJust).to.be.true();
      expect(node.getOrElse(null)).to.be.equal('//node');
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
        .to.have.members([
          patch.nodes.rndId,
          patch.nodes.rndId2,
        ]);
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
      expect(Patch.getNodeById('rndId', patch).isJust)
        .to.be.true();
      expect(Patch.getNodeById('rndId', patch).getOrElse(null))
        .to.be.equal(patch.nodes.rndId);
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
        formatString(
          CONST.ERROR.NODE_NOT_FOUND,
          {
            nodeId,
            patchPath: patch.path,
          }
        )
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
        .to.have.members([
          patch.links['1'],
          patch.links['2'],
        ]);
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
      expect(Patch.getLinkById('non-existent', emptyPatch).isNothing).to.be.true();
    });
    it('should Maybe.Just with link for existent link', () => {
      expect(Patch.getLinkById('1', patch).isJust).to.be.true();
      expect(Patch.getLinkById('1', patch).getOrElse(null)).to.be.equal(patch.links[1]);
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
        assert.sameDeepMembers(
          [expectedPins.in],
          Patch.listInputPins(patch)
        );
      });
    });
    describe('listOutputPins', () => {
      it('should return empty array for empty patch', () => {
        expect(Patch.listOutputPins(emptyPatch))
        .to.be.instanceof(Array)
        .and.to.be.empty();
      });
      it('should return array with one pin', () => {
        assert.sameDeepMembers(
          [expectedPins.out],
          Patch.listOutputPins(patch)
        );
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

        assert.deepEqual(
          orderedPinKeys,
          ['in0', 'in1', 'in2']
        );
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

        assert.deepEqual(
          orderedPinKeys,
          ['in0', 'in1', 'in2']
        );
      });
      it('should extract defaultValue from terminal\'s bound values', () => {
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

        assert.deepEqual(
          { inStr: 'hello', outNum: 42 },
          pinDefaultValues
        );
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

        assert.deepEqual(
          { inStr: '', outNum: 0 },
          pinDefaultValues
        );
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

      const expectedPin = Pin.createPin('1', 'number', 'input', 0, 'A', '', true, 0);

      assert.deepEqual(
        [expectedPin],
        Patch.listPins(newPatch)
      );
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

      const expectedPinBeforeUpdate = Pin.createPin('1', 'string', 'output', 0, '', '', false, '');
      assert.deepEqual(
        [expectedPinBeforeUpdate],
        Patch.listPins(patch)
      );

      const node = Helper.defaultizeNode({
        id: '1',
        type: 'xod/patch-nodes/input-number',
        label: 'A',
      });
      const newPatch = Patch.assocNode(node, patch);

      const expectedPinAfterUpdate = Pin.createPin('1', 'number', 'input', 0, 'A', '', true, 0);
      assert.deepEqual(
        [expectedPinAfterUpdate],
        Patch.listPins(newPatch)
      );
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
        R.compose(
          R.map(Pin.getPinKey),
          Patch.listPins
        )(newPatch)
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
      const link = { id: linkId, input: { nodeId: 'non-existent', pinKey: 'a' }, output: validOutput };
      const err = Patch.validateLink(link, patch);
      expect(err.isLeft).to.be.true();
      Helper.expectErrorMessage(expect, err, CONST.ERROR.LINK_INPUT_NODE_NOT_FOUND);
    });
    it('should return Either.Left for non-existent output node in the patch', () => {
      const link = { id: linkId, input: validInput, output: { nodeId: 'non-existent', pinKey: 'a' } };
      const err = Patch.validateLink(link, patch);
      expect(err.isLeft).to.be.true();
      Helper.expectErrorMessage(expect, err, CONST.ERROR.LINK_OUTPUT_NODE_NOT_FOUND);
    });
    it('should return Either.Right with link', () => {
      const link = { id: linkId, input: validInput, output: validOutput };
      const valid = Patch.validateLink(link, patch);
      expect(valid.isRight).to.be.true();
      Helper.expectEither(
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
        impls: {
          js: '// ok',
        },
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
        impls: {
          js: '// ok',
        },
      });

      it('renumberNodes: should return same patch with nodes and links with new ids', () => {
        expect(Patch.renumberNodes(patch))
          .to.be.deep.equal(expectedPatch);
      });
      it('getTopology: should return correct topology', () => {
        expect(Patch.getTopology(patch))
          .to.be.deep.equal(['a', 'b', 'c']);
        expect(Patch.getTopology(expectedPatch))
          .to.be.deep.equal(['0', '1', '2']);
      });
    });

    describe('isEffectPatch', () => {
      it('should return true for a patch with pulse inputs', () => {
        const someLocalPatch = Helper.defaultizePatch({
          path: PPU.getLocalPath('my-patch'),
          nodes: {
            plsin: {
              type: PPU.getTerminalPath(CONST.PIN_DIRECTION.INPUT, CONST.PIN_TYPE.PULSE),
            },
          },
        });
        expect(Patch.isEffectPatch(someLocalPatch)).to.be.true();

        const terminalPulse = Helper.defaultizePatch({
          path: PPU.getTerminalPath(CONST.PIN_DIRECTION.OUTPUT, CONST.PIN_TYPE.PULSE),
        });
        expect(Patch.isEffectPatch(terminalPulse)).to.be.true();
      });
      it('should return true for a patch with pulse outputs', () => {
        const someLocalPatch = Helper.defaultizePatch({
          path: PPU.getLocalPath('my-patch'),
          nodes: {
            plsout: { type: PPU.getTerminalPath(CONST.PIN_DIRECTION.OUTPUT, CONST.PIN_TYPE.PULSE) },
          },
        });
        expect(Patch.isEffectPatch(someLocalPatch)).to.be.true();

        const terminalPulse = Helper.defaultizePatch({
          path: PPU.getTerminalPath(CONST.PIN_DIRECTION.INPUT, CONST.PIN_TYPE.PULSE),
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
              type: PPU.getTerminalPath(CONST.PIN_DIRECTION.INPUT, CONST.PIN_TYPE.NUMBER),
            },
            someOutputNode: {
              type: PPU.getTerminalPath(CONST.PIN_DIRECTION.INPUT, CONST.PIN_TYPE.BOOLEAN),
            },
          },
        });
        expect(Patch.isEffectPatch(withPins)).to.be.false();
      });
    });

    describe('canBindToOutputs', () => {
      it('should return true for a patch with pulse inputs', () => {
        const patch = Helper.defaultizePatch({
          path: PPU.getLocalPath('my-patch'),
          nodes: {
            plsin: {
              type: PPU.getTerminalPath(CONST.PIN_DIRECTION.INPUT, CONST.PIN_TYPE.PULSE),
            },
          },
        });
        expect(Patch.canBindToOutputs(patch)).to.be.true();
      });
      it('should return true for a patch with pulse outputs', () => {
        const patch = Helper.defaultizePatch({
          path: PPU.getLocalPath('my-patch'),
          nodes: {
            plsout: { type: PPU.getTerminalPath(CONST.PIN_DIRECTION.OUTPUT, CONST.PIN_TYPE.PULSE) },
          },
        });
        expect(Patch.canBindToOutputs(patch)).to.be.true();
      });
      it('should return true for constant patches', () => {
        const patch = Helper.defaultizePatch({
          path: PPU.getConstantPatchPath(CONST.PIN_TYPE.NUMBER),
          nodes: {
            out: {
              type: PPU.getTerminalPath(CONST.PIN_DIRECTION.OUTPUT, CONST.PIN_TYPE.NUMBER),
            },
          },
        });
        expect(Patch.canBindToOutputs(patch)).to.be.true();
      });
      it('should return true for terminal patches', () => {
        const patch = Helper.defaultizePatch({
          path: PPU.getTerminalPath(CONST.PIN_DIRECTION.OUTPUT, CONST.PIN_TYPE.NUMBER),
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
  });
});
