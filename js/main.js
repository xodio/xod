
import d3 from 'd3';
import './d3-plugins';

import { transpilePatch } from '../targets/espruino/patch-transpiler.js';

import AjaxNodeRepository from './dao/nodes';
import settings from './render/settings';
import { renderNodes } from './render/node';
import { renderLinks } from './render/link';
import { listenPins } from './render/pin';
import Patch from './models/patch';
import SelectionMode from './modes/selection';
import LinkingMode from './modes/linking';

var svg = null;
var patch = null;
var nodeRepository = new AjaxNodeRepository();

let selectionMode = null;
let linkingMode = null;

function renderPatch() {
  renderNodes(patch);
  renderLinks(patch);
}

function listenEnterLinking() {
  listenPins(patch, 'click.enter-linking', (pin) => {
    listenPins(patch, 'click.enter-linking', null);
    selectionMode.exit();
    linkingMode.enter(pin, () => {
      linkingMode.exit();
      selectionMode.enter();
      listenEnterLinking();
    });
  });
}

function sendPatchToEspruino() {
  let code = transpilePatch(patch.data());
  console.log('Generated code:', code);

  function onConnected() {
    Espruino.Core.CodeWriter.writeToEspruino(code, () => {
      console.log('*** Sent ***'); 
    });
  }

  function onDisconnected() {
    console.log('*** Disconnected ***'); 
  }

  function openAndSend() {
    Espruino.Core.Serial.startListening(x => console.log('→→', x));
    Espruino.Core.Serial.open('/dev/ttyACM0', onConnected, onDisconnected);
  }

  Espruino.Config.set('MODULE_URL', 'http://localhost:3001/modules');
  Espruino.Config.set('BOARD_JSON_URL', 'http://js.amperka.ru/json');
  Espruino.Config.set('MODULE_EXTENSIONS', '.js');
  Espruino.callProcessor("transformForEspruino", code, (newCode) => {
    code = newCode;
    console.log('Code to be sent:', code);
    openAndSend();
  });
}

/* main */
function main() {
  if (typeof(example) === 'undefined') {
    var example = 'toggle-button';
  }

  d3.json("/examples/" + example + ".json", function(json) {
    nodeRepository.prefetch(Patch.nodeTypes(json), function(err) {
      patch = new Patch(json, nodeRepository);
      var body = d3.select("body");

      svg = body.append('svg')
        .attr('id', 'canvas')
        .attr('width', 1920)
        .attr('height', 1080);

      patch.element(svg);
      renderPatch();

      selectionMode = new SelectionMode(patch);
      linkingMode = new LinkingMode(patch);

      selectionMode.enter();
      listenEnterLinking();
    });
  });

  d3.select('button').on('click', () => {
    d3.event.preventDefault();
    sendPatchToEspruino();
  });
};

document.addEventListener("DOMContentLoaded", main);
