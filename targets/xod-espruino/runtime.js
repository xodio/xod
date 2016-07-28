
export class Node {
  /**
    * @typedef {{
    *   lazy: boolean,
    *   nodeID: number,
    *   inputName: string
    * }} OutLink
    */
  /**
    * @param {function} setup
    *   node’s setup function
    * @param {function} evaluate
    *   node’s evaluation function (aka implementation)
    * @param {boolean} pure
    *   whether `impl` should receive `fire` function as argument
    * @param {Object.<string, function>} inputTypes
    *   input type coercing functions
    * @param {Object.<string, Array.<OutLink>>} outLinks
    *   map from output name to outgoing link description
    * @param {Object.<number, Node>} nodes
    *   map from ID to `Node` instances
    */
  constructor({ setup, evaluate, pure, inputTypes, outLinks, nodes }) {
    this._setup = setup || (() => {});
    this._evaluate = evaluate || (() => {});
    this._pure = (pure === undefined) ? true : pure;
    this._inputTypes = inputTypes || {};
    this._outLinks = outLinks || {};
    this._nodes = nodes;

    this._cachedInputs = {};
    this._pendingOutputs = {};
    this._dirty = false;
  }

  fire(outputs) {
    Object.assign(this._pendingOutputs, outputs);
    this.emit('fire');
  }

  fireCallback() {
    if (!this._pure) {
      return this.fire.bind(this); 
    }
  }

  onTransactionStart() {
    this._sendOutputs(this._pendingOutputs);
    this._pendingOutputs = {};
  }

  isDirty() {
    return this._dirty;
  }

  setup() {
    this._setup(this.fireCallback());
  }

  evaluate() {
    if (!this._dirty) {
      return;
    }

    const result = this._evaluate(this._cachedInputs, this.fireCallback()) || {};
    this._sendOutputs(result);
    this._dirty = false;
  }

  _receiveInput(name, value, lazy) {
    this._cachedInputs[name] = this._inputTypes[name](value);
    this._dirty = this._dirty || !lazy;
  }

  _sendOutputs(signals) {
    Object.keys(signals).forEach(outputName => {
      const outLinks = this._outLinks[outputName];
      if (!outLinks) {
        return;
      }

      const val = signals[outputName];
      outLinks.forEach(({ nodeID, inputName, lazy }) => {
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
    * @param {Object.<number, Node>} nodes
    *   map from ID to Node instances
    * @param {Array.<number, number>} topology 
    *   sorted node index list that defines an order
    *   of the graph traversal
    */
  constructor({ nodes, topology }) {
    this._nodes = nodes;
    this._topology = topology;
    this._pendingTransaction = false;
    this._inTransaction = false;

    const fire = this.fire.bind(this);
    this.forEachNode(node => node.on('fire', fire));
    this.forEachNode(node => node.setup());
  }

  runTransaction() {
    try {
      this._inTransaction = true;
      this.forEachNode(node => node.onTransactionStart());

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

  forEachNode(callback) {
    Object.keys(this._nodes).forEach(id => callback(this._nodes[id]));
  }
}

function onInit() {
  console.log(project);
}
