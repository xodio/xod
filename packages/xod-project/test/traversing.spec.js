import * as R from 'ramda';
import { assert } from 'chai';

import * as H from './helpers';
import * as XP from '../src';
import { setNodeId } from '../src/node';

describe('traversing', () => {
  const project = H.loadXodball('./fixtures/traversing.xodball');
  const bottomPatch = XP.getPatchByPathUnsafe('@/bottom', project);
  const startPin = XP.getPinByKeyUnsafe('startPin', bottomPatch);
  const topPatch = XP.getPatchByPathUnsafe('@/top', project);
  const endPin = XP.getPinByKeyUnsafe('endPin', topPatch);

  describe('listUpstreamPinsToNiix', () => {
    it('traverse from input pin without upstream link returns the same pin pair list', () => {
      const patch = XP.getPatchByPathUnsafe('@/no-links', project);
      const startNode = XP.getNodeByIdUnsafe('bottomNode', patch);
      const inputPinPair = [startPin, startNode];

      const res = XP.listUpstreamPinsToNiix([inputPinPair], patch, project);
      assert.sameDeepOrderedMembers(res, [inputPinPair]);
    });
    it('traverse to closest NIIX node', () => {
      const patch = XP.getPatchByPathUnsafe('@/basic', project);
      const startNode = XP.getNodeByIdUnsafe('bottomNode', patch);
      const endNode = XP.getNodeByIdUnsafe('topNode', patch);
      const inputPinPair = [startPin, startNode];

      const res = XP.listUpstreamPinsToNiix([inputPinPair], patch, project);
      assert.sameDeepOrderedMembers(res, [[endPin, endNode], inputPinPair]);
    });
    it('traverse through jumpers', () => {
      const patch = XP.getPatchByPathUnsafe('@/jumpers', project);
      const startNode = XP.getNodeByIdUnsafe('bottomNode', patch);
      const inputPinPair = [startPin, startNode];

      const endNode = XP.getNodeByIdUnsafe('topNode', patch);

      const res = XP.listUpstreamPinsToNiix([inputPinPair], patch, project);
      assert.lengthOf(res, 18);
      assert.sameDeepOrderedMembers(res[0], [endPin, endNode]);
      assert.sameDeepOrderedMembers(res[17], inputPinPair);
    });
    it('traverse through buses', () => {
      const patch = XP.getPatchByPathUnsafe('@/buses', project);
      const startNode = XP.getNodeByIdUnsafe('bottomNode', patch);
      const inputPinPair = [startPin, startNode];

      const endNode = XP.getNodeByIdUnsafe('topNode', patch);

      const res = XP.listUpstreamPinsToNiix([inputPinPair], patch, project);
      assert.lengthOf(res, 8);
      assert.sameDeepOrderedMembers(res[0], [endPin, endNode]);
      assert.sameDeepOrderedMembers(res[7], inputPinPair);
    });
    it('traverse through buses mixed with jumpers', () => {
      const patch = XP.getPatchByPathUnsafe('@/buses-and-jumpers', project);
      const startNode = XP.getNodeByIdUnsafe('bottomNode', patch);
      const inputPinPair = [startPin, startNode];

      const endNode = XP.getNodeByIdUnsafe('topNode', patch);

      const res = XP.listUpstreamPinsToNiix([inputPinPair], patch, project);
      assert.lengthOf(res, 20);
      assert.sameDeepOrderedMembers(res[0], [endPin, endNode]);
      assert.sameDeepOrderedMembers(res[19], inputPinPair);
    });
    it('traverse through node (identity)', () => {
      const patch = XP.getPatchByPathUnsafe('@/with-identity-pin', project);
      const startNode = XP.getNodeByIdUnsafe('bottomNodeToIdentity', patch);
      const inputPinPair = [startPin, startNode];

      const endNode = XP.getNodeByIdUnsafe('topNode', patch);

      const res = XP.listUpstreamPinsToNiix([inputPinPair], patch, project);
      assert.lengthOf(res, 10);
      assert.sameDeepOrderedMembers(res[0], [endPin, endNode]);
      assert.sameDeepOrderedMembers(res[9], inputPinPair);
      // List contains pairs inside the `@/identity-pin` node
      // So let's check that patched node ids correctly
      assert.equal(XP.getNodeId(res[3][1]), 'nodeWithIdentityPin~HJjD9YS6V');
      assert.equal(
        XP.getNodeId(res[5][1]),
        'nodeWithIdentityPin~HJjD9YS6V~__out__'
      );
    });
    it('traverse to the NIIX node (inside another node)', () => {
      const patch = XP.getPatchByPathUnsafe('@/with-identity-pin', project);
      const startNode = XP.getNodeByIdUnsafe('bottomNodeToNull', patch);
      const inputPinPair = [startPin, startNode];

      const nullPatch = XP.getPatchByPathUnsafe('@/null', project);
      const nullPin = XP.getPinByKeyUnsafe('nullNodeOutputPin', nullPatch);
      const identityPatch = XP.getPatchByPathUnsafe('@/identity-pin', project);
      // Because we're setting parent node ids into NodeId
      // we have to change it in the test case
      const nullNode = R.compose(
        setNodeId('nodeWithIdentityPin~nullNode'),
        XP.getNodeByIdUnsafe('nullNode')
      )(identityPatch);

      const res = XP.listUpstreamPinsToNiix([inputPinPair], patch, project);
      assert.lengthOf(res, 4);
      assert.sameDeepOrderedMembers(res[0], [nullPin, nullNode]);
      assert.sameDeepOrderedMembers(res[3], inputPinPair);
    });
  });
});
