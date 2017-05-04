import R from 'ramda';
import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';

import { mergePatchesAndNodeTypes, convertPinType, toV2 } from '../src/adapter';
import bundleV1 from './fixtures/bundle.v1.json';

chai.use(dirtyChai);

const overExtractedPins = R.over(R.lensIndex(2));

// :: Pin -> PinV2
const oldPinToNew = R.when(
  R.has('injected'),
  R.applySpec({
    curried: R.prop('injected'),
    value: R.prop('value'),
  })
);

const emptyOrNil = R.either(R.isNil, R.isEmpty);
// :: [] -> []
const extractPinValues = R.ifElse(
  R.propSatisfies(emptyOrNil, 2),
  overExtractedPins(R.always({})),
  overExtractedPins(R.map(R.compose(R.values, oldPinToNew)))
);
// :: [] -> Function
const extractNodesToCompare = keys => R.compose(
  // sorting is a dirty hack that may break test
  R.sort((a, b) => (a[1].x + a[1].y) - (b[1].x + b[1].y)),
  R.map(R.compose(
    extractPinValues,
    R.props(keys)
  )),
  R.values,
  R.propOr([], 'nodes')
);
// :: [Patch] -> [String]
const extractNodeIds = R.compose(
  R.reduce(R.concat, []),
  R.map(R.compose(
    R.keys,
    R.prop('nodes')
  )),
  R.values
);

// :: [String] -> String -> String
const replaceNodePinKey = nodeIds => R.when(
  R.contains(R.__, nodeIds),
  R.always('nodePinKey')
);

const getNodeByTypeFromPatch = type => R.compose(
  R.find(R.propEq('type', type)),
  R.values,
  R.prop('nodes')
);

describe('Adapters', () => {
  describe('mergePatchesAndNodeTypes', () => {
    it('should merge contents of two props `patches` and `nodeTypes`', () => {
      const testObject = {
        patches: { a: {}, b: {} },
        nodeTypes: { b: {}, c: {} },
      };
      const merged = mergePatchesAndNodeTypes(testObject);

      expect(merged)
        .to.be.an('object')
        .that.have.all.keys(['a', 'b', 'c']);
    });
  });
  describe('convertPinType', () => {
    it('should convert `bool` into `boolean`', () => {
      expect(convertPinType('bool')).to.be.equal('boolean');
    });
    it('should not convert `string`', () => {
      expect(convertPinType('string')).to.be.equal('string');
    });
    it('should not convert `number`', () => {
      expect(convertPinType('number')).to.be.equal('number');
    });
    it('should not convert `pulse`', () => {
      expect(convertPinType('pulse')).to.be.equal('pulse');
    });
  });
  describe('toV2', () => {
    let bundleV2;
    before(() => {
      bundleV2 = toV2(bundleV1);
    });

    it('should have keys [authors, description, license, name, patches]', () => {
      const primitiveV1 = {
        meta: {
          name: 'awesome-project',
          author: 'Amperka team',
        },
      };

      expect(toV2(primitiveV1))
        .to.be.an('object')
        .and.have.all.keys('authors', 'description', 'license', 'name', 'patches');
    });
    it('should have an author in authors array', () => {
      expect(bundleV2)
        .to.have.property('authors')
        .that.contains(bundleV1.meta.author);
    });
    it('should have a project name', () => {
      expect(bundleV2)
        .to.have.property('name')
        .that.equals(bundleV1.meta.name);
    });
    it('should have the same patches', () => {
      const patchKeys = R.compose(
        R.keys,
        mergePatchesAndNodeTypes
      )(bundleV1);

      expect(bundleV2)
        .to.be.an('object')
        .that.have.property('patches')
        .that.have.all.keys(patchKeys);
    });
    it('should have the same nodes', () => {
      const nodesOld = R.compose(
        R.map(extractNodesToCompare(['typeId', 'position'])),
        mergePatchesAndNodeTypes
      )(bundleV1);

      const nodesNew = R.compose(
        R.map(extractNodesToCompare(['type', 'position'])),
        R.prop('patches')
      )(bundleV2);

      expect(nodesNew).to.deep.equal(nodesOld);
    });
    it('should rekey pins', () => {
      const node = getNodeByTypeFromPatch('@/qux')(bundleV2.patches['@/main']);
      const expectedPinKey = R.compose(
        R.prop('id'),
        getNodeByTypeFromPatch('xod/core/input-number')
      )(bundleV2.patches['@/qux']);

      expect(node)
      .to.have.property('pins')
      .that.deep.equals({
        [expectedPinKey]: {
          curried: true,
          value: 42,
        },
      });
    });
    it('should have the same nodeType pins', () => {
      const nodeIdsOld = R.compose(
        extractNodeIds,
        mergePatchesAndNodeTypes
      )(bundleV1);
      const pinsOld = R.compose(
        R.map(R.compose(
          R.map(R.compose(
            R.over(R.lensIndex(1), convertPinType),
            R.over(R.lensIndex(0), replaceNodePinKey(nodeIdsOld)),
            R.props(['key', 'type', 'direction'])
          )),
          R.values,
          R.propOr({}, 'pins')
        )),
        mergePatchesAndNodeTypes
      )(bundleV1);

      const nodeIdsNew = R.compose(
        extractNodeIds,
        R.prop('patches')
      )(bundleV2);
      const pinsNew = R.compose(
        R.map(R.compose(
          R.map(R.compose(
            R.over(R.lensIndex(0), replaceNodePinKey(nodeIdsNew)),
            R.props(['key', 'type', 'direction'])
          )),
          R.values,
          R.propOr({}, 'pins')
        )),
        R.prop('patches')
      )(bundleV2);

      expect(pinsNew).to.deep.equal(pinsOld);
    });
  });
});
