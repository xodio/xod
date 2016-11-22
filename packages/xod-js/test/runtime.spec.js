
import EventEmitter from 'events';
import dirtyChai from 'dirty-chai';
import R from 'ramda';

import { default as chai, expect } from 'chai';
import { Node, Project, PULSE } from '../platform/runtime';

chai.use(dirtyChai);

describe('Runtime basics', () => {
  describe('PULSE uniquiness', () => {
    it('PULSE should not be equal to user defined objects', () => {
      const userDefinedObj = { type: 'pulse' };
      expect(R.equals(PULSE, userDefinedObj),
             'Test\'s version of PULSE is outdated!').to.be.true();
      expect(PULSE).to.not.equal(userDefinedObj);
    });
  });
});

describe('Runtime', () => {
  before(() => {
    // Espruino have native `on`, `emit` and `clone` methods defined for any
    // object. They are not standard so we simply monkey-patch `Object` to
    // properly run Espruino’s runtime in tests
    /* eslint-disable no-extend-native */
    Object.prototype.on = EventEmitter.prototype.on;
    Object.prototype.emit = EventEmitter.prototype.emit;
    Object.prototype.clone = function clone() {
      return Object.assign({}, this);
    };
    /* eslint-enable no-extend-native */
  });

  after(() => {
    delete Object.prototype.on;
    delete Object.prototype.emit;
    delete Object.prototype.clone;
  });

  describe('Project with numeric nodes', () => {
    let nodes;

    beforeEach(() => {
      nodes = {};
    });

    function createNode(id, params) {
      nodes[id] = new Node(Object.assign({ id, nodes }, params));
    }

    function createPublisherNode(id, outLinks) {
      const emitter = new EventEmitter();
      createNode(id, {
        setup: e => emitter.on('publish', e.fire),
        pure: false,
        outLinks,
      });

      return emitter;
    }

    function createSubscriberNode(id) {
      const mock = {
        calls: [],
      };

      createNode(id, {
        evaluate: e => mock.calls.push(e.inputs),
        pure: false,
        inputTypes: { val: Number },
        nodes,
      });

      return mock;
    }

    function launch(topology) {
      const project = new Project({ nodes, topology });
      project.launch();
    }

    it('should transmit signal from publisher to subscriber', () => {
      const publisher = createPublisherNode(1, {
        val: [{ nodeId: 2, key: 'val' }],
      });

      const subscriber = createSubscriberNode(2);

      launch([1, 2]);
      publisher.emit('publish', { val: 42 });
      expect(subscriber.calls).to.be.eql([
        { val: 42 },
      ]);
    });

    it('should transmit multiple signals from publisher to subscriber', () => {
      const publisher = createPublisherNode(1, {
        val: [{ nodeId: 2, key: 'val' }],
      });

      const subscriber = createSubscriberNode(2);

      launch([1, 2]);
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
        val: [{ nodeId: 2, key: 'inp' }],
      });

      createNode(2, {
        evaluate: e => ({ out: e.inputs.inp + 100 }),
        inputTypes: { inp: Number },
        outLinks: {
          out: [{ nodeId: 3, key: 'inp' }],
        },
      });

      createNode(3, {
        evaluate: e => ({ out: e.inputs.inp + 1000 }),
        inputTypes: { inp: Number },
        outLinks: {
          out: [{ nodeId: 4, key: 'val' }],
        },
      });

      const subscriber = createSubscriberNode(4);

      launch([1, 2, 3, 4]);
      publisher.emit('publish', { val: 42 });
      publisher.emit('publish', { val: 43 });
      expect(subscriber.calls).to.be.eql([
        { val: 1142 },
        { val: 1143 },
      ]);
    });

    it('should allow simultaneous signals at start', () => {
      // constant 42
      createNode(1, {
        setup: e => e.fire({ val: 42 }),
        outLinks: {
          val: [{ nodeId: 3, key: 'a' }],
        },
      });

      // constant 100
      createNode(2, {
        setup: e => e.fire({ val: 100 }),
        outLinks: {
          val: [{ nodeId: 3, key: 'b' }],
        },
      });

      // sum
      createNode(3, {
        evaluate: (e) => ({ out: e.inputs.a + e.inputs.b }),
        inputTypes: { a: Number, b: Number },
        outLinks: {
          out: [{ nodeId: 4, key: 'val' }],
        },
      });

      const subscriber = createSubscriberNode(4);

      launch([1, 2, 3, 4]);
      expect(subscriber.calls).to.be.eql([
        { val: 142 },
      ]);
    });

    // TODO: it('should postpone impure nodes');
  });
});
