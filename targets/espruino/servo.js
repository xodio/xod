
var Node = require('@xod/impl/node');
var connectServo = require('@amperka/servo').connect;

var Servo = function(meta, props) {
  Node.call(this, meta, props);
  this._servo = connectServo(P12);
};

Servo.prototype = Object.create(Node.prototype);
Servo.prototype.constructor = Servo;

Servo.prototype.eval = function() {
  var val = this.inputs.value.pop();
  this._servo.write(val);
};

exports = Servo;
