
import d3 from 'd3';
import './d3-plugins';

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

/* main */
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
