import d3 from 'd3';
import AjaxNodeRepository from './dao/nodes';
import settings from './render/settings';
import renderLinks from './render/link';
import { renderPins, pinPosition } from './render/pin';
import {Patch, Node, Link, Pin} from './models/patch';
import LinkingBehavior from './behavior/linking';

var svg = null;
var patch = null;
var nodeRepository = new AjaxNodeRepository();
var selectedNode = null;
var rubberLine = null;

function alignPixel(x) {
  if (Array.isArray(x)) {
    return x.map(alignPixel);
  }

  return Math.floor(x) + 0.5;
}

function createNode(node) {
  let g = d3.select(this);

  g.append('rect')
    .attr('class', 'outline')
    .attr('width', settings.node.width)
    .attr('height', settings.node.height);

  g.append('text')
    .text(node.type())
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'central')
    .attr('x', settings.node.width / 2)
    .attr('y', settings.node.height / 2)
    .attr('class', 'title');

  renderPins({nodeElement: g});
}

function renderNode(node) {
  let g = d3.select(this);

  g.attr('transform', 'translate(' + alignPixel(node.x()) + ', ' + alignPixel(node.y()) + ')')
    .classed('selected', node === selectedNode);

  renderPins({nodeElement: g});
}

function renderPatch() {
  let nodeDrag = d3.behavior.drag()
    .origin(node => node.pos())
    .on('drag', handleNodeDrag);

  let nodes = svg.selectAll("g.node")
    .data(patch.nodes())
    .enter()
      .append("g")
      .attr('class', 'node')
      .each(createNode)
      .each(renderNode)
      .call(nodeDrag)
      .on('click', handleNodeClick);

  renderLinks({links: patch.links(), canvas: svg});
}

function handleNodeDrag(node) {
  let g = d3.select(this);

  node.pos({
    x: d3.event.x,
    y: d3.event.y
  });

  g.attr('transform', 'translate(' + alignPixel(d3.event.x) + ', ' + alignPixel(d3.event.y) + ')');
  renderLinks()
}

function handleNodeClick(node) {
  selectedNode = node;
  d3.selectAll("g.node").each(renderNode);
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

    renderPatch();

    let linkingBehavior = new LinkingBehavior(svg, () => {
      renderLinks({links: patch.links(), canvas: svg});
    });
    linkingBehavior.listen();
  });
});
