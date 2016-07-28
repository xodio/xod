
import EventEmitter from 'events';
import { expect } from 'chai';
import { Node, Project } from 'xod-espruino/runtime';

describe('Runtime', () => {
  describe('Project node graph', () => {
    it('should allow to fire without links', () => {
      let nodes = {};

      const pub = nodes[1] = new Node({
        pure: false,
        nodes,
      });

      new Project({ nodes, topology: [1] });

      pub.fire({ val: 42 });
    });

    it('should transmit signal from publisher to subsriber', () => {
      let calls = [];
      let nodes = {};

      const ee = new EventEmitter();
      const publishSetup = (fire) => {
        ee.on('sample', val => fire({ val }));
      }

      nodes[1] = new Node({
        setup: publishSetup,
        pure: false,
        outLinks: {
          val: [{
            nodeID: 2,
            inputName: 'val',
          }],
        },
        nodes,
      });

      nodes[2] = new Node({
        pure: false,
        evaluate: inputs => calls.push(inputs),
        inputTypes: { val: Number },
        nodes,
      });

      new Project({ nodes, topology: [1, 2] });

      ee.emit('sample', 42);
      expect(calls).to.be.eql([{ val: 42 }]);
    });
  });
});
