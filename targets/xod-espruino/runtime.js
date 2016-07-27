
export class NodeImpl {
  constructor(fireFunc) {
    this.fire = fireFunc;
  }

  evaluate() {
  }
}

export class Node {
  constructor({ impl, links, inputTypes, nodes }) {
    // links: {
    //   outputName: [{
    //     lazy: Boolean,
    //     nodeID: Number,
    //     inputName: String
    //   }]
    // }
    //
    // inputTypes: {
    //   inputName: (val) => val
    // }

    this._links = links;
    this._nodes = nodes;
    this._inputTypes = inputTypes;

    if (impl.prototype instanceof NodeImpl) {
      // Class-based implementation
      const instance = new impl(this.fire.bind(this));
      this._evaluate = instance.evaluate.bind(instance);

      // FIXME: find more elegant way as we need this just for tests
      this.implObj = instance; 
    } else {
      // Function-based implementation
      this._evaluate = impl;
    }

    this._inputs = {};
    this._dirty = false;
    this._pendingOutputs = {};
  }

  fire(outputs) {
    Object.assign(this._pendingOutputs, outputs);
    this.emit('fire');
  }

  onTransactionStart() {
    this._sendOutputs(this._pendingOutputs);
    this._pendingOutputs = {};
  }

  isDirty() {
    return this._dirty;
  }

  evaluate() {
    if (!this._dirty) {
      return;
    }

    const result = this._evaluate(this._inputs) || {};
    this._sendOutputs(result);
    this._dirty = false;
  }

  _receiveInput(name, value, lazy) {
    this._inputs[name] = this._inputTypes[name](value);
    this._dirty = this._dirty || !lazy;
  }

  _sendOutputs(signals) {
    Object.keys(signals).forEach(outputName => {
      const outputLinks = this._links[outputName];
      if (!outputLinks) {
        return;
      }

      const val = signals[outputName];
      outputLinks.forEach(({ nodeID, inputName, lazy }) => {
        this._nodes[nodeID]._receiveInput(inputName, val, lazy);
      });
    });
  }
}

// Object.on and Object.emit is implemented in Espruino, but in
// standard JavaScript it is not
if (!('on' in Node.prototype && 'emit' in Node.prototype)) {
  Node.prototype.on = function(event, callback) {
    if (!this.hasOwnProperty('__listeners')) {
      this.__listeners = {};
    }

    if (!this.__listeners.hasOwnProperty(event)) {
      this.__listeners[event] = [];
    }

    this.__listeners[event].push(callback);
  };

  Node.prototype.emit = function(event, payload) {
    const callbacks = (this.__listeners || {})[event] || [];
    callbacks.forEach(cb => cb(payload));
  };
}

export class Project {
  /**
    * Defines a project (program). There would be just a single instance
    * of project on target platform.
    *
    * @param {Object} nodes - indexed node list {id: node}
    * @param {Array} topology - sorted node index list that defines an order
    *   of the graph traversal
    */
  constructor({ nodes, topology }) {
    this._nodes = nodes;
    this._topology = topology;
    this._pendingTransaction = false;
    this._inTransaction = false;

    const fire = this.fire.bind(this);
    Object.keys(this._nodes).forEach(id => this._nodes[id].on('fire', fire));
  }

  runTransaction() {
    try {
      this._inTransaction = true;
      Object.keys(this._nodes).forEach(id => this._nodes[id].onTransactionStart());

      let node;
      while ( (node = this.getFirstDirtyNode()) ) {
        node.evaluate();
      }

    } finally {
      this._inTransaction = false;
    }

    setTimeout(() => this.flushTransaction(), 0);
  }

  /**
    * Runs a new transaction if required and possible
    */
  flushTransaction() {
    if (!this._pendingTransaction || this._inTransaction) {
      return;
    }

    this._pendingTransaction = false;
    this.runTransaction();
  }

  getFirstDirtyNode() {
    const len = this._topology.length;
    for (let i = 0; i < len; ++i) {
      const nodeID = this._topology[i];
      const node = this._nodes[nodeID];
      if (node.isDirty()) {
        return node;
      }
    }
  }

  fire() {
    this._pendingTransaction = true;
    this.flushTransaction();
  }
}

function onInit() {
  console.log(project);
}
