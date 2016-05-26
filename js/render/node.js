
import settings from './settings';
import { renderPins } from './pin';
import { renderLinks } from './link';

const SELECTOR = 'g.node';

export function renderNodes(patch) {
  let nodeDrag = d3.behavior.drag()
      .origin(node => node.pos())
      .on('drag', handleDrag);

  let sel = patch.element().selectAll(SELECTOR)
    .data(patch.nodes(), d => d.id())
    .each(update);

  sel.enter()
    .appendClassed(SELECTOR)
    .each(create)
    .each(update)
    .call(nodeDrag);

  sel.exit()
    .remove();
}

export function listenNodes(patch, type, listener) {
  patch.element().selectAll(SELECTOR).on(type, listener);
}

function create(node) {
  let g = d3.select(this);
  node.element(g);

  let inputCount = node.inputs().length;
  let outputCount = node.outputs().length;
  let pinGapCount = Math.max(inputCount-1, outputCount-1, 0);

  let width = settings.node.pin.gap * (pinGapCount + 2);

  let outline = g.append('rect')
    .attr('class', 'outline')
    .attr('width', width)
    .attr('height', settings.node.height);

  let label = g.append('text')
    .text(node.label())
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'central')
    .attr('x', width / 2)
    .attr('y', settings.node.height / 2)
    .attr('class', 'title');

  let labelWidth = label.node().getBBox().width;
  let minWidth = labelWidth + 2 * settings.node.horzMargin;
  if (minWidth <= width) {
    return;
  }

  // text is too wide, extend node width
  width = Math.ceil(minWidth / settings.node.pin.gap) * settings.node.pin.gap;
  outline.attr('width', width);
  label.attr('x', width / 2);
}

function update(node) {
  d3.select(this)
    .translate(node.pos())
    .classed('selected', node.isFeatured('selected'));
  renderPins(node);
}

function handleDrag(node) {
  node.pos(d3.event)
  d3.select(this).translate(d3.event);
  renderLinks(node.patch());
}
