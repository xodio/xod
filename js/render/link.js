
import { pinPosition } from './pin';

export function renderLinks(patch) {
  patch.element().selectAll('path.link')
    .data(patch.links())
    .each(update)
    .enter()
      .append('path')
      .attr('class', 'link')
      .each(update);
}

function update(link) {
  let path = d3.select(this);
  let from = pinPosition(link.from());
  let to = pinPosition(link.to());
  path.attr('d', ['M', from.x, from.y, 'L', to.x, to.y].join(' '));
}
