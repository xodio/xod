
import EventEmitter from 'events';
import { expect } from 'chai';
import { Node, Project } from 'xod-espruino/runtime';

describe('Runtime', () => {
  describe('Project node graph', () => {
    let nodes;
    let topology;

    beforeEach(() => {
      nodes = {};
      topology = [];
    });

    function createNode(id, params) {
      const node = nodes[id] = new Node(Object.assign({ nodes }, params));
      topology.push[id];
      return node;
    }

    function createProject() {
      return new Project(nodes, topology);
    }

    it('should transmit signal from publisher to subsriber', () => {
      const publishStream = new EventEmitter();
      createNode(1, {
        setup: (fire) => publishStream.on('sample', fire),
        pure: false,
        outLinks: {
          val: [{
            nodeID: 2,
            inputName: 'val',
          }],
        },
      });

      let calls = [];
      createNode(2, {
        evaluate: inputs => calls.push(inputs),
        pure: false,
        inputTypes: { val: Number },
        nodes,
      });

      new Project({ nodes, topology: [1, 2] });

      publishStream.emit('sample', { val: 42 });
      expect(calls).to.be.eql([
        { val: 42 }
      ]);
    });

    it('should transmit multiple signals from publisher to subsriber', () => {
      const publishStream = new EventEmitter();
      createNode(1, {
        setup: (fire) => publishStream.on('sample', fire),
        pure: false,
        outLinks: {
          val: [{
            nodeID: 2,
            inputName: 'val',
          }],
        },
      });

      let calls = [];
      createNode(2, {
        evaluate: inputs => calls.push(inputs),
        pure: false,
        inputTypes: { val: Number },
        nodes,
      });

      new Project({ nodes, topology: [1, 2] });

      publishStream.emit('sample', { val: 42 });
      publishStream.emit('sample', { val: 43 });
      publishStream.emit('sample', { val: 44 });
      expect(calls).to.be.eql([
        { val: 42 },
        { val: 43 },
        { val: 44 },
      ]);
    });
  });
});
