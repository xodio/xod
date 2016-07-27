
import { expect } from 'chai';
import { NodeImpl, Node, Project } from 'xod-espruino/runtime';

class NumPublisher extends NodeImpl {
}

class NumSubscriber extends NodeImpl {
  evaluate(inputs) {
    this.evaluations = this.evaluations || [];
    this.evaluations.push(inputs.val);
  }
}


describe('Runtime', () => {
  describe('Project node graph', () => {
    it('should allow to fire without links', () => {
      let nodes = {};

      const pub = nodes[1] = new Node({
        impl: NumPublisher,
        links: {},
        nodes,
      });

      new Project({ nodes, topology: [1] });

      pub.fire({ val: 42 });
    });

    it('should transmit signal from publisher to subsriber', () => {
      let nodes = {};

      const pub = nodes[1] = new Node({
        impl: NumPublisher,
        links: {
          val: [{
            nodeID: 2,
            inputName: 'val',
          }],
        },
        inputTypes: { val: Number },
        nodes,
      });

      const sub = nodes[2] = new Node({
        impl: NumSubscriber,
        links: {},
        inputTypes: { val: Number },
        nodes,
      });

      new Project({ nodes, topology: [1, 2] });

      pub.fire({ val: 42 });
      expect(sub.implObj.evaluations).to.be.eql([42]);
    });
  });
});
