
import settings from './settings';
import { renderPins } from './pin';
import { renderLinks } from './link';

const SELECTOR = 'g.node';

export function renderNodes(patch) {
  let nodeDrag = d3.behavior.drag()
      .origin(node => node.pos())
      .on('drag', handleDrag);

  patch.element().selectAll(SELECTOR)
    .data(patch.nodes())
    .each(update)
    .enter()
      .appendClassed(SELECTOR)
      .each(create)
      .each(update)
      .call(nodeDrag);
}

function create(node) {
  let g = d3.select(this);
  node.element(g);

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
}

function update(node) {
  d3.select(this);
    .transform(node.pos());
  renderPins(node);
}

function alignPixel(x) {
  if (Array.isArray(x)) {
    return x.map(alignPixel);
  }

  return Math.floor(x) + 0.5;
}

function handleDrag(node) {
  node.pos(d3.event)
  d3.select(this).translate(d3.event);
  renderLinks(node.patch());
}
