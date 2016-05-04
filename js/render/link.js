
import { pinPosition } from './pin';

const SELECTOR = 'path.link';

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
  patch.element().selectAll(SELECTOR)
    .on(type, listener);
}

function create(link) {
  link.element(d3.select(this));
}

function update(link) {
  let path = d3.select(this);
  let from = pinPosition(link.from());
  let to = pinPosition(link.to());
  let lineData = ['M', from.x, from.y, 'L', to.x, to.y].join(' ');
  path
    .attr('d', lineData)
    .classed('selected', link.isFeatured('selected'));
}
