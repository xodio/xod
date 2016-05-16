
import { pinPosition } from './pin';

const SELECTOR = 'g.link';

export function renderLinks(patch) {
  let sel = patch.element().selectAll(SELECTOR)
    .data(patch.links(), d => d.id())
    .each(update);

  sel.enter()
    .appendClassed(SELECTOR)
    .each(create)
    .each(update)

  sel.exit()
    .remove();
}

export function listenLinks(patch, type, listener) {
  patch.element().selectAll(SELECTOR + ' path.dummy')
    .on(type, listener);
}

function create(link) {
  let sel = d3.select(this);
  link.element(sel);
  sel.appendClassed('path.visual');
  sel.appendClassed('path.dummy');
}

function update(link) {
  let g = d3.select(this);
  let from = pinPosition(link.from());
  let to = pinPosition(link.to());
  let lineData = ['M', from.x, from.y, 'L', to.x, to.y].join(' ');
  g.selectAll('path')
    .attr('d', lineData)
    .classed('selected', link.isFeatured('selected'));
}
