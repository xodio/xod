import R from 'ramda';
import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';

import * as Patch from '../src/patch';
import * as CONST from '../src/constants';

import * as Helper from './helpers';

chai.use(dirtyChai);

describe('Patch', () => {
  // constructors
  describe('createPatch', () => {
    it('should return Patch that is an object', () => {
      const patch = Patch.createPatch();

      expect(patch).is.an('object');
    });
    it('should have key: nodes === {}', () => {
      const patch = Patch.createPatch('@/test');

      expect(patch)
        .to.have.property('nodes')
        .that.is.an('object')
        .that.is.empty();
    });
    it('should have key: links === []', () => {
      const patch = Patch.createPatch('@/test');

      expect(patch)
        .to.have.property('links')
        .that.is.an('array')
        .that.is.empty();
    });
  });
  describe('duplicatePatch', () => {
    const patch = { nodes: {}, label: 'test' };
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

  // properties
  describe('getPatchLabel', () => {
    it('should return empty String for empty patch object', () => {
      expect(Patch.getPatchLabel({})).to.be.equal('');
    });
    it('should return patch label', () => {
      const label = 'patchLabel';
      expect(Patch.getPatchLabel({ label })).to.be.equal(label);
    });
  });
  describe('setPatchLabel', () => {
    it('should return patch with new label', () => {
      const newLabel = 'new label';
      const patch = { label: 'old label' };
      const newPatch = Patch.setPatchLabel(newLabel, patch);

      expect(newPatch)
        .to.have.property('label')
        .that.is.a('string')
        .that.equals(newLabel);
    });
    it('should always set a string to label', () => {
      expect(Patch.setPatchLabel('test', {}))
        .to.have.property('label')
        .that.equals('test');
      expect(Patch.setPatchLabel(5, {}))
        .to.have.property('label')
        .that.equals('5');
      expect(Patch.setPatchLabel([1, 2], {}))
        .to.have.property('label')
        .that.equals('1,2');
      expect(Patch.setPatchLabel({}, {}))
        .to.have.property('label')
        .that.equals('[object Object]');
    });
  });
  describe('listPatchPlatforms', () => {
    it('should return empty array for empty patch', () => {
      expect(Patch.listPatchPlatforms({}))
        .to.be.instanceof(Array)
        .to.be.empty();
    });
    it('should return array with keys: `js`, `espruino`', () => {
      const patch = {
        impls: {
          js: '',
          espruino: '',
        },
      };
      expect(Patch.listPatchPlatforms(patch))
        .to.be.an('array')
        .to.have.members(['js', 'espruino']);
    });
  });

  // entity getters
  describe('listNodes', () => {
    const patch = {
      nodes: {
        'rndId': { id: 'rndId' },
        'rndId2': { id: 'rndId2' },
      },
    };

    it('should return an empty array for empty patch', () => {
      expect(Patch.listNodes({}))
        .to.be.instanceof(Array)
        .to.be.empty();
    });
    it('should return an array of nodes', () => {
      expect(Patch.listNodes(patch))
        .to.be.instanceof(Array)
        .to.have.members([
          patch.nodes['rndId'],
          patch.nodes['rndId2'],
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
    const patch = {
      nodes: {
        'rndId': { id: 'rndId' },
      },
    };

    it('should Maybe.Nothing for non-existent node', () => {
      expect(Patch.getNodeById('non-existent', {}).isNothing)
        .to.be.true();
    });
    it('should Maybe.Just with node for existent node', () => {
      expect(Patch.getNodeById('rndId', patch).isJust)
        .to.be.true();
      expect(Patch.getNodeById('rndId', patch).getOrElse(null))
        .to.be.equal(patch.nodes['rndId']);
    });
  });
  describe('listLinks', () => {
    const patch = {
      links: {
        1: { id: '1' },
        2: { id: '2' },
      },
    };

    it('should return an empty array for empty patch', () => {
      expect(Patch.listLinks({}))
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
    const patch = {
      links: {
        1: { id: '1' },
      },
    };

    it('should Maybe.Nothing for non-existent link', () => {
      expect(Patch.getLinkById('non-existent', {}).isNothing).to.be.true();
    });
    it('should Maybe.Just with link for existent link', () => {
      expect(Patch.getLinkById('1', patch).isJust).to.be.true();
      expect(Patch.getLinkById('1', patch).getOrElse(null)).to.be.equal(patch.links[1]);
    });
  });

  describe('listLinksByNode', () => {
    const patch = {
      links: {
        1: {
          id: '1',
          input: { pinKey: 'fromPin', nodeId: '@/from' },
          output: { pinKey: 'toPin', nodeIf: '@/to' },
        },
      },
      nodes: {
        '@/from': { id: '@/from' },
        '@/to': { id: '@/to' },
      },
    };

    it('should return empty array for non-existent node', () => {
      expect(Patch.listLinksByNode('@/non-existent', patch))
        .to.be.instanceof(Array)
        .and.to.be.empty();
    });
    it('should return empty array for empty patch', () => {
      expect(Patch.listLinksByNode('@/a', {}))
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
    const patch = {
      links: {
        1: {
          id: '1',
          input: { pinKey: 'fromPin', nodeId: '@/from' },
          output: { pinKey: 'toPin', nodeIf: '@/to' },
        },
      },
      nodes: {
        '@/from': { id: '@/from' },
        '@/to': { id: '@/to' },
      },
    };

    it('should return empty array for non-existent node', () => {
      expect(Patch.listLinksByPin('fromPin', '@/non-existent', patch))
        .to.be.instanceof(Array)
        .and.to.be.empty();
    });
    it('should return empty array for empty patch', () => {
      expect(Patch.listLinksByPin('fromPin', '@/from', {}))
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

  describe('lists', () => {
    const patch = {
      pins: {
        in: { key: 'in', direction: CONST.PIN_DIRECTION.INPUT },
        out: { key: 'out', direction: CONST.PIN_DIRECTION.OUTPUT },
      },
    };
    describe('listPins', () => {
      it('should return empty array for empty patch', () => {
        expect(Patch.listPins({}))
        .to.be.instanceof(Array)
        .and.to.be.empty();
      });
      it('should return array with two pins', () => {
        expect(Patch.listPins(patch))
        .to.be.instanceof(Array)
        .and.have.all.members([patch.pins.in, patch.pins.out]);
      });
    });
    describe('listInputPins', () => {
      it('should return empty array for empty patch', () => {
        expect(Patch.listInputPins({}))
        .to.be.instanceof(Array)
        .and.to.be.empty();
      });
      it('should return array with one pin', () => {
        expect(Patch.listInputPins(patch))
        .to.be.instanceof(Array)
        .and.have.all.members([patch.pins.in]);
      });
    });
    describe('listOutputPins', () => {
      it('should return empty array for empty patch', () => {
        expect(Patch.listOutputPins({}))
        .to.be.instanceof(Array)
        .and.to.be.empty();
      });
      it('should return array with one pin', () => {
        expect(Patch.listOutputPins(patch))
        .to.be.instanceof(Array)
        .and.have.all.members([patch.pins.out]);
      });
    });
  });

  // entity setters
  describe('assocPin', () => {
    it('should return Either.Left for invalid pin', () => {
      const newPatch = Patch.assocPin({}, {});
      expect(newPatch.isLeft).to.be.true();
    });
    it('should return Either.Right with new patch with new pin', () => {
      const pin = {
        key: 'A',
        type: CONST.PIN_TYPE.STRING,
        direction: CONST.PIN_DIRECTION.OUTPUT,
      };
      const newPatch = Patch.assocPin(pin, {});

      Helper.expectEither(
        validPatch => {
          expect(validPatch)
            .to.be.an('object')
            .that.have.property('pins')
            .that.have.property(pin.key)
            .to.be.deep.equal(pin);
        },
        newPatch
      );
    });
    it('should not affect on other pins', () => {
      const patchWithPins = {
        pins: {
          A: { key: 'A', type: CONST.PIN_TYPE.NUMBER, direction: CONST.PIN_DIRECTION.INPUT },
          C: { key: 'C', type: CONST.PIN_TYPE.STRING, direction: CONST.PIN_DIRECTION.OUTPUT },
        },
      };
      const pin = {
        key: 'B',
        type: CONST.PIN_TYPE.BOOLEAN,
        direction: CONST.PIN_DIRECTION.INPUT,
      };
      const newPatch = Patch.assocPin(pin, patchWithPins);
      const expectedPatch = R.assocPath(['pins', pin.key], pin, patchWithPins);

      Helper.expectEither(
        validPatch => {
          expect(validPatch)
            .to.be.an('object')
            .to.be.deep.equal(expectedPatch);
        },
        newPatch
      );
    });
  });
  describe('dissocPin', () => {
    const patch = {
      pins: {
        a: { key: 'a' },
        b: { key: 'b' },
      },
    };

    it('should remove pin by key', () => {
      const newPatch = Patch.dissocPin('a', patch);

      expect(newPatch)
        .to.be.an('object')
        .that.have.property('pins')
        .that.not.have.keys(['a']);
    });
    it('should remove pin by Pin object', () => {
      const pin = patch.pins.b;
      const newPatch = Patch.dissocPin(pin, patch);

      expect(newPatch)
        .to.be.an('object')
        .that.have.property('pins')
        .that.not.have.keys(['b']);
    });
    it('should not affect on other pins', () => {
      const newPatch = Patch.dissocPin('a', patch);

      expect(newPatch)
        .to.be.an('object')
        .that.have.property('pins')
        .that.have.keys(['b'])
        .and.not.have.keys(['a']);
    });
    it('should return unchanges Patch for non-existent pin/key', () => {
      expect(Patch.dissocPin('c', patch))
        .to.be.an('object')
        .and.equals(patch);
      expect(Patch.dissocPin({ key: 'c' }, patch))
        .to.be.an('object')
        .and.equals(patch);
    });
  });
  // @TODO: Add test for adding pinNode (assocNode -> assocPin)
  describe('assocNode', () => {
    it('should return Patch with new Node', () => {
      const patch = { path: '@/myPatch' };
      const node = { id: '1' };
      const newPatch = Patch.assocNode(node, patch);

      expect(newPatch)
        .to.have.property('path')
        .that.equals(patch.path);
      expect(newPatch)
        .to.have.property('nodes')
        .to.have.property('1')
        .that.equals(node);
    });
    it('should replace old Node with same id', () => {
      const patch = { path: '@/myPatch', nodes: { 1: { id: '1', label: 'old' } } };
      const node = { id: '1', label: 'new' };
      const newPatch = Patch.assocNode(node, patch);

      expect(newPatch)
        .to.have.property('nodes')
        .to.have.property('1')
        .that.equals(node);
    });
  });
  // @TODO: Add test for deleting links!
  // @TODO: Add test for deleting pinNode
  describe('dissocNode', () => {
    const patch = {
      nodes: {
        'rndId': { id: 'rndId' },
        'rndId2': { id: 'rndId2' },
      },
      links: {
        1: {
          id: '1',
          output: { pinKey: 'out', nodeId: 'rndId' },
          input: { pinKey: 'in', nodeId: 'rndId2' },
        },
      },
    };

    it('should remove node by id', () => {
      const newPatch = Patch.dissocNode('rndId', patch);

      expect(newPatch)
        .to.be.an('object')
        .that.have.property('nodes')
        .that.not.have.keys(['rndId']);
    });
    it('should remove node by Node object', () => {
      const node = patch.nodes['rndId'];
      const newPatch = Patch.dissocNode(node, patch);

      expect(newPatch)
        .to.be.an('object')
        .that.have.property('nodes')
        .that.not.have.keys(['rndId']);
    });
    it('should remove connected link', () => {
      const node = patch.nodes['rndId'];
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
        .and.equals(patch);
      expect(Patch.dissocNode({ id: '@/non-existent' }, patch))
        .to.be.an('object')
        .and.equals(patch);
    });
  });
  describe('assocLink', () => {}); // @TODO
  describe('dissocLink', () => {
    const patch = {
      links: {
        1: { id: '1' },
        2: { id: '2' },
      },
    };

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
        .and.equals(patch);
      expect(Patch.dissocLink({ id: '3' }, patch))
        .to.be.an('object')
        .and.equals(patch);
    });
  });

  // validations
  describe('validatePatch', () => {
    it('should return Either.Left for empty object', () => {
      const patch = Patch.validatePatch({});
      expect(patch.isLeft).to.be.true();
      Helper.expectErrorMessage(expect, patch, CONST.ERROR.PATCH_INVALID);
    });
    it('should return Either.Right with valid patch', () => {
      const patch = { nodes: {}, links: {} };
      const test = Patch.validatePatch(patch);
      expect(test.isRight).to.be.true();

      /* istanbul ignore next */
      Helper.expectEither(
        rightPatch => { expect(rightPatch).to.be.equal(patch); },
        test
      );
    });
  });
  describe('validateLink', () => {
    // @TODO
  });

  // etc
});
