/* eslint-disable no-unused-vars */

// UTILS
function clonePonyfill() {
  if (Object.prototype.clone) {
    return function clone(obj) { return obj.clone(); };
  }
  if (!Object.assign) {
    Object.defineProperty(Object, 'assign', {
      enumerable: false,
      configurable: true,
      writable: true,
      value: assignPolyfill
    });
  }

  return function clone(obj) { return Object.assign({}, obj); };
}

function assignPolyfill(target, firstSource) {
  if (target === undefined || target === null) {
    throw new TypeError('Cannot convert first argument to object');
  }

  var to = Object(target);
  for (var i = 1; i < arguments.length; i++) {
    var nextSource = arguments[i];
    if (nextSource === undefined || nextSource === null) {
      continue;
    }

    var keysArray = Object.keys(Object(nextSource));
    for (var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex++) {
      var nextKey = keysArray[nextIndex];
      var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
      if (desc !== undefined && desc.enumerable) {
        to[nextKey] = nextSource[nextKey];
      }
    }
  }
  return to;
}


var clone = clonePonyfill();

function nullFunc() {}
function identity(x) { return x; }

// CONSTANTS
var PULSE = {type: 'pulse'};

// RUNTIME
/* eslint-enable no-unused-vars */

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
  * @param {Object.<string, function>} inputTypes
  *   input type coercing functions
  * @param {Object.<string, Array.<OutLink>>} outLinks
  *   map from output name to outgoing link description
  * @param {Object.<number, Node>} nodes
  *   map from ID to `Node` instances
  */
function Node(args) {
  this._id = args.id;
  this._setup = args.setup || nullFunc;
  this._evaluate = args.evaluate || nullFunc;
  this._inputTypes = args.inputTypes || {};
  this._value = args.value || null;
  this._outLinks = args.outLinks || {};
  this._nodes = args.nodes;

  this._context = {};
  this._cachedInputs = {};
  this._pendingOutputs = clone(args.outValues);
  this._dirty = false;

  this._fireCallback = nullFunc;
}

/**
  * Fires new signals at arbitrary point of time.
  *
  * The method is used by impure nodes to trigger external signals.
  * It is used by pure nodes as well but only in their setup to send
  * initial values.
  */
Node.prototype.fire = function(outputs) {
  var _outputs = outputs || {};
  var self = this;
  Object.keys(_outputs).forEach(function(key) {
    self._pendingOutputs[key] = _outputs[key];
  });

  this._fireCallback();
};

/**
  * Add event listener for fire event
  */
Node.prototype.onFire = function(listener) {
  this._fireCallback = listener;
};

/**
  * Transaction start handler.
  *
  * It would be called from outside once before each transaction.
  */
Node.prototype.onTransactionStart = function() {
  this._sendOutputs(this._pendingOutputs);
  this._pendingOutputs = {};
};

/**
  * Returns whether any inputs were changed and node requires evaluation
  * in current transaction.
  */
Node.prototype.isDirty = function() {
  return this._dirty;
};

/**
  * Initializes the `Node`, sends initial signals.
  *
  * Called once the graph is ready at the very beginning of program execution.
  */
Node.prototype.setup = function() {
  this._setup({
    fire: this.fire.bind(this),
    context: this._context
  });
};

/**
  * Evaluates the `Node` taking input signals and producting output signals.
  */
Node.prototype.evaluate = function() {
  var fire, inputs, result, self;

  if (!this._dirty) {
    return;
  }

  fire = this.fire.bind(this);
  inputs = clone(this._cachedInputs);

  result = this._evaluate({
    inputs: inputs,
    fire: fire,
    context: this._context
  }) || {};

  // remove "outdated" pulses
  self = this;
  Object.keys(this._cachedInputs).forEach(function(key) {
    if (self._cachedInputs[key] === PULSE) {
      delete self._cachedInputs[key];
    }
  });

  this._sendOutputs(result);
  this._dirty = false;
};

Node.prototype._receiveInput = function(name, value, lazy) {
  this._cachedInputs[name] = this._inputTypes[name](value);
  this._dirty = this._dirty || !lazy;
};

Node.prototype._sendOutputs = function(signals) {
  var self = this;

  Object.keys(signals).forEach(function(outputName) {
    var val;
    var outLinks = self._outLinks[outputName];

    if (!outLinks) {
      return;
    }

    val = signals[outputName];
    outLinks.forEach(function(link) {
      self._nodes[link.nodeId]._receiveInput(link.key, val, !!link.lazy);
    });
  });
};

/**
  * @param {Object.<number, Node>} args.nodes
  *   map from ID to Node instances
  * @param {Array<number>} args.topology
  *   sorted node index list that defines an order
  *   of the graph traversal
  */
function Project(args) {
  this._nodes = args.nodes;
  this._topology = args.topology;
  this._pendingTransaction = false;
  this._inTransaction = false;
  this._dirtyIndex = 0;
}

/**
  * Setups all nodes all starts graph execution.
  */
Project.prototype.launch = function() {
  var fire = this.onNodeFire.bind(this);
  this.forEachNode(function(node) { node.onFire(fire); });

  this._inSetup = true;

  try {
    this.forEachNode(function(node) { node.setup(); });
  } finally {
    this._inSetup = false;
  }

  this.flushTransaction();
};

/**
  * Starts a new transaction if required and possible.
  *
  * If ran it lead to cascade evaluation of all dirty nodes.
  */
Project.prototype.flushTransaction = function() {
  if (!this._pendingTransaction || this._inTransaction || this._inSetup) {
    return;
  }

  this._pendingTransaction = false;
  this._inTransaction = true;

  try {
    this.forEachNode(function(node) { node.onTransactionStart(); });
    this.forEachDirtyNode(function(node) { node.evaluate(); });
  } finally {
    this._inTransaction = false;
    this._dirtyIndex = 0;
  }

  setTimeout(this.flushTransaction.bind(this), 0);
};

/**
  * Returns the first `Node` that should be evaluated according
  * to topological sort indexes. Returns `undefined` if all nodes
  * are up to date in current transaction.
  */
Project.prototype.getFirstDirtyNode = function() {
  var i, nodeId, node;
  var len = this._topology.length;
  for (i = this._dirtyIndex; i < len; ++i) {
    nodeId = this._topology[i];
    node = this._nodes[nodeId];
    if (node.isDirty()) {
      this._dirtyIndex = i + 1;
      return node;
    }
  }

  return null;
};

Project.prototype.forEachDirtyNode = function(callback) {
  var node;
  for (node = this.getFirstDirtyNode(); node; node = this.getFirstDirtyNode()) {
    callback(node);
  }
};

/**
  * Node fire handler.
  *
  * Gets called when any node uses `Node.fire` to issue an external signal
  * or an initial signal.
  */
Project.prototype.onNodeFire = function() {
  this._pendingTransaction = true;
  this.flushTransaction();
};

/**
  * Executes `callback` with `node` argument for every node in the graph.
  */
Project.prototype.forEachNode = function(callback) {
  var self = this;
  Object.keys(this._nodes).forEach(function(id) { callback(self._nodes[id]); });
};

if (typeof module !== 'undefined') {
  // Export some entities for tests
  module.exports.Node = Node;
  module.exports.Project = Project;
  module.exports.PULSE = PULSE;
  module.exports.identity = identity;
}


// =====================================================================

var impl = {};

// ---------------------------------------------------------------------
impl['xod/core/clock'] = {};
(function(module, exports) {module.exports.setup = function(e) {
  e.context.intervalID = null;
};
module.exports.evaluate = function(e) {
  if (e.context.intervalID) {
    clearInterval(e.context.intervalID);
  }

  e.context.intervalID = setInterval(function() {
    e.fire({ TICK: PULSE });
  }, e.inputs.IVAL * 1000);
};
})({exports: impl['xod/core/clock']}, impl['xod/core/clock']);

// ---------------------------------------------------------------------
impl['xod/core/boot'] = {};
(function(module, exports) {module.exports.evaluate = function(e) {
  e.fire({ BOOT: PULSE });
};
})({exports: impl['xod/core/boot']}, impl['xod/core/boot']);

// ---------------------------------------------------------------------
impl['xod/core/digital-output'] = {};
(function(module, exports) {var fs = require('fs');

// =============================================================================
//
// Raspberry utils
// (could be moved into another file, that will be appended by transpiler)
//
// =============================================================================

function getRaspberryPort(port) {
  return '/sys/class/gpio/gpio' + port + '/';
}
function getRaspberryPortValue(port) {
  return getRaspberryPort(port) + 'value';
}
function getRaspberryPortDirection(port) {
  return getRaspberryPort(port) + 'direction';
}

function exportPort(port, cb) {
  fs.writeFile(
    '/sys/class/gpio/export',
    port,
    function writePort(err) {
      if (err) throw err;
      cb(port);
    }
  );
}

function setPortDirection(direction, port, cb) {
  if (direction !== 'in' && direction !== 'out') {
    throw new Error('Wrong direction `' + direction + '` for Pin `' + port + '`');
  }
  fs.writeFile(
    getRaspberryPortDirection(port),
    direction,
    function writeDirection(err) {
      if (err) throw err;
      cb(port);
    }
  );
}

/**
 * To work with Raspberry ports we have to export it
 * and then set its direction. To prevent blocking of
 * the eventloop of NodeJS we use the asynchronous
 * version of fs.writeFile.
 *
 * In case that we have already exported this port:
 * just skip it and return resolved port number.
 * Otherwise: export and set direction for the new port.
 */
function preparePort(direction, oldPort, newPort, cb) {
  if (oldPort === newPort) return cb(newPort);

  exportPort(newPort, function exportPortCallback(port) {
    setPortDirection(direction, port, function setDirectionCallback() {
      cb(port);
    });
  });
}

// =============================================================================
//
// Implementation of the Node
//
// =============================================================================

module.exports.setup = function(e) {
  e.context.port = null;
};
module.exports.evaluate = function(e) {
  var port = e.context.port;

  preparePort('out', port, e.inputs.PORT, function evaluateDigitalOutput(_port) {
    e.context.port = _port;
    fs.writeFile(
      getRaspberryPortValue(_port),
      +e.inputs.SIG
    );
  });
};
})({exports: impl['xod/core/digital-output']}, impl['xod/core/digital-output']);

// ---------------------------------------------------------------------
impl['xod/core/flip-flop'] = {};
(function(module, exports) {module.exports.setup = function(e) {
  e.context.state = false;
};
module.exports.evaluate = function(e) {
  var state = e.context.state;
  var newState;

  if (e.inputs.TGL) {
    newState = !e.context.state;
  } else if (e.inputs.SET) {
    newState = true;
  } else {
    newState = false;
  }

  if (newState === state) return;

  e.context.state = newState;
  return { MEM: newState, CHNG: PULSE };
};
})({exports: impl['xod/core/flip-flop']}, impl['xod/core/flip-flop']);

// ---------------------------------------------------------------------
impl['xod/core/constant-number'] = {};
(function(module, exports) {module.exports.setup = function(e) {
  e.fire();
};
})({exports: impl['xod/core/constant-number']}, impl['xod/core/constant-number']);

// ---------------------------------------------------------------------
impl['xod/core/constant-boolean'] = {};
(function(module, exports) {module.exports.setup = function(e) {
  e.fire();
};
})({exports: impl['xod/core/constant-boolean']}, impl['xod/core/constant-boolean']);

// =====================================================================

var nodes = {};

nodes['0'] = new Node({
  "id": "0",
  "implId": "xod/core/clock",
  "inputTypes": {
    "IVAL": Number,
    "RST": identity
  },
  "outValues": {},
  "outLinks": {
    "TICK": [
      {
        "key": "TGL",
        "nodeId": "3"
      }
    ]
  },
  "setup": impl['xod/core/clock'].setup,
  "upkeep": impl['xod/core/clock'].upkeep,
  "evaluate": impl['xod/core/clock'].evaluate,
  "nodes": nodes
});

nodes['1'] = new Node({
  "id": "1",
  "implId": "xod/core/boot",
  "inputTypes": {},
  "outValues": {},
  "outLinks": {
    "BOOT": [
      {
        "key": "RST",
        "nodeId": "0"
      }
    ]
  },
  "setup": impl['xod/core/boot'].setup,
  "upkeep": impl['xod/core/boot'].upkeep,
  "evaluate": impl['xod/core/boot'].evaluate,
  "nodes": nodes
});

nodes['2'] = new Node({
  "id": "2",
  "implId": "xod/core/digital-output",
  "inputTypes": {
    "PORT": Number,
    "SIG": Boolean,
    "UPD": identity
  },
  "outValues": {},
  "outLinks": {},
  "setup": impl['xod/core/digital-output'].setup,
  "upkeep": impl['xod/core/digital-output'].upkeep,
  "evaluate": impl['xod/core/digital-output'].evaluate,
  "nodes": nodes
});

nodes['3'] = new Node({
  "id": "3",
  "implId": "xod/core/flip-flop",
  "inputTypes": {
    "SET": identity,
    "TGL": identity,
    "RST": identity
  },
  "outValues": {
    "MEM": false
  },
  "outLinks": {
    "CHNG": [
      {
        "key": "UPD",
        "nodeId": "2"
      }
    ],
    "MEM": [
      {
        "key": "SIG",
        "nodeId": "2"
      }
    ]
  },
  "setup": impl['xod/core/flip-flop'].setup,
  "upkeep": impl['xod/core/flip-flop'].upkeep,
  "evaluate": impl['xod/core/flip-flop'].evaluate,
  "nodes": nodes
});

nodes['4'] = new Node({
  "id": "4",
  "implId": "xod/core/constant-number",
  "inputTypes": {},
  "outValues": {
    "VAL": 0.25
  },
  "outLinks": {
    "VAL": [
      {
        "key": "IVAL",
        "nodeId": "0"
      }
    ]
  },
  "setup": impl['xod/core/constant-number'].setup,
  "upkeep": impl['xod/core/constant-number'].upkeep,
  "evaluate": impl['xod/core/constant-number'].evaluate,
  "nodes": nodes
});

nodes['5'] = new Node({
  "id": "5",
  "implId": "xod/core/constant-number",
  "inputTypes": {},
  "outValues": {
    "VAL": 13
  },
  "outLinks": {
    "VAL": [
      {
        "key": "PORT",
        "nodeId": "2"
      }
    ]
  },
  "setup": impl['xod/core/constant-number'].setup,
  "upkeep": impl['xod/core/constant-number'].upkeep,
  "evaluate": impl['xod/core/constant-number'].evaluate,
  "nodes": nodes
});

nodes['6'] = new Node({
  "id": "6",
  "implId": "xod/core/constant-boolean",
  "inputTypes": {},
  "outValues": {
    "VAL": false
  },
  "outLinks": {
    "VAL": [
      {
        "key": "SET",
        "nodeId": "3"
      }
    ]
  },
  "setup": impl['xod/core/constant-boolean'].setup,
  "upkeep": impl['xod/core/constant-boolean'].upkeep,
  "evaluate": impl['xod/core/constant-boolean'].evaluate,
  "nodes": nodes
});

nodes['7'] = new Node({
  "id": "7",
  "implId": "xod/core/constant-boolean",
  "inputTypes": {},
  "outValues": {
    "VAL": false
  },
  "outLinks": {
    "VAL": [
      {
        "key": "RST",
        "nodeId": "3"
      }
    ]
  },
  "setup": impl['xod/core/constant-boolean'].setup,
  "upkeep": impl['xod/core/constant-boolean'].upkeep,
  "evaluate": impl['xod/core/constant-boolean'].evaluate,
  "nodes": nodes
});

var topology = ["1","4","5","6","7","0","3","2"];
var project = new Project({ nodes: nodes, topology: topology });


project.launch();


