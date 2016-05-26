
import settings from './settings';

const SELECTOR = 'g.pin';

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
  let g = node.element().selectAll(SELECTOR)
    .data(node.pins(), d => [node.id(), d.isOutput(), d.index()])
    .each(update)
    .enter()
      .appendClassed(SELECTOR)
      .classed('input', (d) => d.isInput())
      .classed('output', (d) => d.isOutput())
      .each(create)
      .each(update);
}

export function listenPins(owner, type, listener) {
  owner.element().selectAll(SELECTOR)
    .on(type, listener);
}

function create(pin) {
  let g = d3.select(this);
  pin.element(g);

  let r = settings.node.pin.radius;
  let sym = null;

  if (pin.type() === 'event' || pin.type() === 'trigger') {
    sym = g.append('path')
      .attr('d', trianglePath(r * 1.3)); // 1.3 is a visual compensation
  } else {
    sym = g.append('circle')
      .attr('r', r);
  }

  let labelMargin = settings.node.pin.labelMargin * (pin.isInput() ? -1 : +1);
  g.append('text')
    .text(pin.label())
    .attr('dominant-baseline', 'central')
    .attr('text-anchor', pin.isInput() ? 'start' : 'end')
    .attr('transform', `translate(0, ${labelMargin}) rotate(-90)`);

  g.translate({
    x: pinOffset(pin.index()),
    y: pin.isInput() ? 0 : settings.node.height
  });
}

function trianglePath(r) {
  // equilaral triangle from circumscribed circle
  const sqrt3 = Math.sqrt(3);
  const sin30 = 0.5;
  const cos30 = sqrt3 / 2;

  let a = r * sqrt3; // one side
  let h = a * cos30;

  return [
    'M', 0, 2 / 3 * h,
    'l', -a * sin30, -h,
    'l', a, 0,
    'Z'
  ].join(' ');
}

function update(pin) {
  d3.select(this).classed('valid-link', pin.isFeatured('valid-link'));
}
