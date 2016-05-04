
import { pinPosition } from './pin';

const SELECTOR = 'path.link';

export function renderLinks(patch) {
  patch.element().selectAll(SELECTOR)
    .data(patch.links())
    .each(update)
    .enter()
      .appendClassed(SELECTOR)
      .each(update);
}

export function listenLinks(patch, type, listener) {
  patch.element().selectAll(SELECTOR)
    .on(type, listener);
}

function update(link) {
  let path = d3.select(this);
  let from = pinPosition(link.from());
  let to = pinPosition(link.to());
  let lineData = ['M', from.x, from.y, 'L', to.x, to.y].join(' ');
  path
    .attr('d', lineData)
    .classed('selected', link.featured('selected'));
}
