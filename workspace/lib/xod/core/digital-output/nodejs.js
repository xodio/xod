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
