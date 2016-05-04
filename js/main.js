import d3 from 'd3';
import AjaxNodeRepository from './dao/nodes';
import settings from './render/settings';
import { renderNodes } from './render/node';
import renderLinks from './render/link';
import { renderPins, pinPosition } from './render/pin';
import Patch from './models/patch';
import LinkingBehavior from './behavior/linking';

var svg = null;
var patch = null;
var nodeRepository = new AjaxNodeRepository();

function renderPatch() {
  renderNodes(patch);
  renderLinks({links: patch.links(), canvas: svg});
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

    let linkingBehavior = new LinkingBehavior(svg, () => {
      renderLinks({links: patch.links(), canvas: svg});
    });
    linkingBehavior.listen();
  });
});
