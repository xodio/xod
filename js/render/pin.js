
import settings from './settings';

export function pinOffset(i) {
  return settings.node.pin.margin + i * settings.node.pin.gap;
}

export function pinPosition(pin) {
  let nodePos = pin.node().pos();
  let dy = pin.isInput() ? 0 : settings.node.height;
  return {x: nodePos.x, y: y + dy}
}

export function renderPins(opts) {
  if (opts.nodeElement) {
    let node = opts.nodeElement.datum();
    selection = opts.nodeElement.selectAll('circle.pin')
      .data(node.pins());
      .each(update)
      .enter()
        .createAll();
  } else {
    d3.selectAll('circle.pin');
      .each(update);
  }
}

function createAll() {
  d3.selectAll(this)
    .enter()
      .append('circle')
      .classed('pin', true)
      .classed('input', (d) => d.isInput())
      .classed('output', (d) => d.isOutput())
      .attr('cx', (d) => pinOffset(d.index()))
      .attr('cy', (d) => d.isInput() ? 0 : settings.node.height)
      .each(update);
}

function update() {
  d3.select(this)
    .attr('r', settings.node.pin.radius);
}
