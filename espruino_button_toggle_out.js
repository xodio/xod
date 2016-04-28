
var SwitchModule = require('@xod/core/switch.js');
var TFlipFlopModule = require('@xod/core/t-flip-flop.js');
var LedModule = require('@xod/core/led.js');

var nodes = {
  2: new SwitchModule.Node(2),
  1: new TFlipFlopModule.Node(1),
  3: new LedModule.Node(3)
};

nodes[2].link('press', nodes[1], 'toggle');
nodes[1].link('value', nodes[3], 'enable');
