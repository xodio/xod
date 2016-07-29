
import EventEmitter from 'events';
import { expect } from 'chai';
import { Node, Project } from 'xod-espruino/runtime';

describe('Runtime', () => {
  describe('Project with numeric nodes', () => {
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

      createNode(id, {
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

    it('should evaluate pure nodes', () => {
      const publisher = createPublisherNode(1, {
        val: [{ nodeID: 2, inputName: 'inp' }],
      });

      createNode(2, {
        evaluate: ({ inp }) => ({ out: inp + 100 }),
        inputTypes: { inp: Number },
        outLinks: {
          out: [{ nodeID: 3, inputName: 'inp' }],
        }
      });

      createNode(3, {
        evaluate: ({ inp }) => ({ out: inp + 1000 }),
        inputTypes: { inp: Number },
        outLinks: {
          out: [{ nodeID: 4, inputName: 'val' }],
        }
      });

      const subscriber = createSubscriberNode(4);

      new Project({ nodes, topology: [1, 2, 3, 4] });
      publisher.emit('publish', { val: 42 });
      publisher.emit('publish', { val: 43 });
      expect(subscriber.calls).to.be.eql([
        { val: 1142 },
        { val: 1143 },
      ]);

    });

    //it('should postpone impure nodes');
    //it('should allow squashed transactions');
  });
});
