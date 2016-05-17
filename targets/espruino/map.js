
var Node = require('@xod/impl/node');

var RangeMap = function(meta, props) {
  Node.call(this, meta, props);
};

RangeMap.prototype = Object.create(Node.prototype);
RangeMap.prototype.constructor = RangeMap;

RangeMap.prototype.eval = function() {
  var x = this.inputs['in'].pop();
  var inA = this.inputs.inA.pop();
  var inB = this.inputs.inB.pop();
  var outA = this.inputs.outA.pop();
  var outB = this.inputs.outB.pop();
  var clip = this.inputs.clip.pop();

  var k = (x - inA) / (inB - inA);
  var y = outA + k * (outB - outA);

  if (clip) {
    if (outA < outB) {
      y = Math.min(outB, y);
      y = Math.max(y, outA);
    } else {
      y = Math.min(outA, y);
      y = Math.max(y, outB);
    }
  }

  this.outputs.out.set(y);
};

exports = RangeMap;
