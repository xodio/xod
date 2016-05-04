
import settings from './settings';

const SELECTOR = 'circle.pin';

export function pinOffset(i) {
  return settings.node.pin.margin + i * settings.node.pin.gap;
}

export function pinPosition(pin) {
  let nodePos = pin.node().pos();
  return {
    x: nodePos.x + pinOffset(pin.index()),
    y: nodePos.y + (pin.isInput() ? 0 : settings.node.height)
  }
}

export function renderPins(node) {
  if (node) {
    node.element().selectAll(SELECTOR)
      .data(node.pins())
      .each(update)
      .enter()
        .appendClassed(SELECTOR)
        .classed('input', (d) => d.isInput())
        .classed('output', (d) => d.isOutput())
        .attr('cx', (d) => pinOffset(d.index()))
        .attr('cy', (d) => d.isInput() ? 0 : settings.node.height)
        .each(update);
  } else {
    // TODO: remove global
    d3.selectAll('circle.pin')
      .each(update);
  }
}

export function listenPins(owner, type, listener) {
  owner.element().selectAll('circle.pin')
    .on(type, listener);
}

function update() {
  d3.select(this)
    .attr('r', settings.node.pin.radius);
}
