
import { pinPosition } from './pin';

export default function renderLinks(opts) {
  opts = opts || {};
  if (opts.links) {
    opts.canvas.selectAll('path.link')
      .data(opts.links)
      .each(update)
      .enter()
        .append('path')
        .attr('class', 'link')
        .each(update);
  } else {
    d3.selectAll('path.link')
      .each(update);
  }
}

function update(link) {
  let path = d3.select(this);
  let from = pinPosition(link.from());
  let to = pinPosition(link.to());
  path.attr('d', ['M', from.x, from.y, 'L', to.x, to.y].join(' '));
}
