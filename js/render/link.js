
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

function update(link) {
  let path = d3.select(this);
  let from = pinPosition(link.from());
  let to = pinPosition(link.to());
  path.attr('d', ['M', from.x, from.y, 'L', to.x, to.y].join(' '));
}
