var fs = require('fs');

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

function writeFile(filename, data, callback) {
  return new Promise(function(resolve, reject) {
    fs.writeFile(filename, data, function(err) {
      if (err) return reject(err);
      callback(resolve, reject);
    });
  });
}

function exportPort(port) {
  return writeFile(
    '/sys/class/gpio/export',
    port,
    function(resolve) { resolve(port); }
  );
}

function setPortDirection(direction, port) {
  if (direction !== 'in' && direction !== 'out') {
    throw new Error('Wrong direction `' + direction + '` for Pin `' + port + '`');
  }
  return writeFile(
    getRaspberryPortDirection(port),
    direction,
    function(resolve) { resolve(port); }
  );
}

/**
 * To work with Raspberry ports we have to export it
 * and then set its direction. To prevent blocking of
 * the eventloop of NodeJS we use the asynchronous
 * version of fs.writeFile wrapped by Promises.
 *
 * In case that we have already exported this port:
 * just skip it and return resolved port number.
 * Otherwise: export and set direction for the new port.
 */
function preparePort(direction, oldPort, newPort) {
  if (oldPort === newPort) { return Promise.resolve(newPort); }
  return exportPort(newPort).then(function(port) {
    return setPortDirection(direction, port);
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

  preparePort('out', port, e.inputs.PORT)
    .then(function(_port) {
      e.context.port = _port;
      return writeFile(
        getRaspberryPortValue(_port),
        +e.inputs.SIG,
        function(resolve) { resolve(_port); }
      )
    })
    .catch(function(err) { console.error(err); });
};
