
import EventEmitter from 'events';
import { expect } from 'chai';
import { Node, Project } from 'xod-espruino/runtime';

describe('Runtime', () => {
  describe('Project node graph', () => {
    let nodes;

    beforeEach(() => {
      nodes = {};
    });

    function createNode(id, params) {
      nodes[id] = new Node(Object.assign({ nodes }, params));
    }

    function createPublisherNode(id, outLinks) {
      const ee = new EventEmitter();
      createNode(id, {
        setup: (fire) => ee.on('publish', fire),
        pure: false,
        outLinks
      });

      return ee;
    }

    function createSubscriberNode(id) {
      let mock = {
        calls: []
      };

      createNode(2, {
        evaluate: inputs => mock.calls.push(inputs),
        pure: false,
        inputTypes: { val: Number },
        nodes,
      });

      return mock;
    }

    it('should transmit signal from publisher to subsriber', () => {
      const publisher = createPublisherNode(1, {
        val: [{ nodeID: 2, inputName: 'val' }],
      });

      const subscriber = createSubscriberNode(2);

      new Project({ nodes, topology: [1, 2] });

      publisher.emit('publish', { val: 42 });
      expect(subscriber.calls).to.be.eql([
        { val: 42 }
      ]);
    });

    it('should transmit multiple signals from publisher to subsriber', () => {
      const publisher = createPublisherNode(1, {
        val: [{ nodeID: 2, inputName: 'val' }],
      });

      const subscriber = createSubscriberNode(2);

      new Project({ nodes, topology: [1, 2] });

      publisher.emit('publish', { val: 42 });
      publisher.emit('publish', { val: 43 });
      publisher.emit('publish', { val: 44 });
      expect(subscriber.calls).to.be.eql([
        { val: 42 },
        { val: 43 },
        { val: 44 },
      ]);
    });
  });
});
