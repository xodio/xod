
export class Node {
  /**
    * @typedef {{
    *   lazy: boolean,
    *   nodeId: number,
    *   key: string
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
  constructor({ id, setup, evaluate, pure, inputTypes, outLinks, nodes }) {
    this._id = id;
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

  /**
    * Fires new signals at arbitrary point of time.
    *
    * The method is used by impure nodes to trigger external signals.
    * It is used by pure nodes as well but only in their setup to send
    * initial values.
    */
  fire(outputs) {
    Object.assign(this._pendingOutputs, outputs);
    this.emit('fire');
  }

  /**
    * Transaction start handler.
    *
    * It would be called from outside once before each transaction.
    */
  onTransactionStart() {
    this._sendOutputs(this._pendingOutputs);
    this._pendingOutputs = {};
  }

  /**
    * Returns whether any inputs were changed and node requires evaluation
    * in current transaction.
    */
  isDirty() {
    return this._dirty;
  }

  /**
    * Initializes the `Node`, sends initial signals.
    *
    * Called once the graph is ready at the very beginning of program execution.
    */
  setup() {
    this._setup(this.fire.bind(this));
  }

  /**
    * Evaluates the `Node` taking input signals and producting output signals.
    */
  evaluate() {
    if (!this._dirty) {
      return;
    }

    const fireCallback = this._pure ? null : this.fire.bind(this);
    const inputs = Object.assign({}, this._cachedInputs);
    const result = this._evaluate(inputs, fireCallback) || {};
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
      outLinks.forEach(({ nodeId, key, lazy }) => {
        this._nodes[nodeId]._receiveInput(key, val, !!lazy);
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
  }

  /**
    * Setups all nodes all starts graph execution.
    */
  launch() {
    const fire = this.onNodeFire.bind(this);
    this.forEachNode(node => node.on('fire', fire));

    this._inSetup = true;

    try {
      this.forEachNode(node => node.setup());
    } finally {
      this._inSetup = false;
    }

    this.flushTransaction();
  }

  /**
    * Starts a new transaction if required and possible.
    *
    * If ran it lead to cascade evaluation of all dirty nodes.
    */
  flushTransaction() {
    if (!this._pendingTransaction || this._inTransaction || this._inSetup) {
      return;
    }

    this._pendingTransaction = false;
    this._inTransaction = true;

    try {
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
    * Returns the first `Node` that should be evaluated according
    * to topological sort indexes. Returns `undefined` if all nodes
    * are up to date in current transaction.
    */
  getFirstDirtyNode() {
    const len = this._topology.length;
    for (let i = 0; i < len; ++i) {
      const nodeId = this._topology[i];
      const node = this._nodes[nodeId];
      if (node.isDirty()) {
        return node;
      }
    }
  }

  /**
    * Node fire handler.
    *
    * Gets called when any node uses `Node.fire` to issue an external signal
    * or an initial signal.
    */
  onNodeFire() {
    this._pendingTransaction = true;
    this.flushTransaction();
  }

  /**
    * Executes `callback` with `node` argument for every node in the graph.
    */
  forEachNode(callback) {
    Object.keys(this._nodes).forEach(id => callback(this._nodes[id]));
  }
}
