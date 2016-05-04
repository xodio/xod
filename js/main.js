import d3 from 'd3';
import settings from './render/settings';
import LinkRenderer from './render/link';
import { renderPins, pinPosition } from './render/pin';
import RubberLine from './render/rubber-line';
import AjaxNodeRepository from './dao/nodes';
import {Patch, Node, Link, Pin} from './models/patch';

var linkRenderer = null;

var svg = null;
var patch = null;
var nodeRepository = new AjaxNodeRepository();
var selectedNode = null;
var linkingPin = null;
var rubberLine = null;

function alignPixel(x) {
  if (Array.isArray(x)) {
    return x.map(alignPixel);
  }

  return Math.floor(x) + 0.5;
}

function beginLink(pin) {
  linkingPin = pin;
  selectedNode = null;

  rubberLine = new RubberLine(svg, pinPosition(pin));

  svg.on('mousemove', () => {
    let [x, y] = d3.mouse(svg.node());
    rubberLine.targetPoint({x: x - 1, y: y + 1});
  });
}

function completeLink(pin) {
  linkingPin.linkTo(pin);
  linkingPin = null;
  rubberLine.remove();
  svg.on('mousemove', null);
  linkRenderer.upsert();
}

function handlePinClick(pin) {
  d3.event.preventDefault();
  if (linkingPin) {
    completeLink(pin);
  } else {
    beginLink(pin);
  }

  d3.selectAll("g.node").each(renderNode);
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

  linkRenderer.upsert();
}

function handleNodeDrag(node) {
  let g = d3.select(this);

  node.pos({
    x: d3.event.x,
    y: d3.event.y
  });

  g.attr('transform', 'translate(' + alignPixel(d3.event.x) + ', ' + alignPixel(d3.event.y) + ')');
  linkRenderer.upsert();
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

    linkRenderer = new LinkRenderer(svg, patch);
    renderPatch();
  });
});
