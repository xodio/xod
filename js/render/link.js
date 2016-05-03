
var settings = {
  node: {
    width: 128,
    height: 32,

    pin: {
      radius: 4,
      margin: 16,
      gap: 16,
    }
  }
};

function pinPosition(pin) {
  let node = pin.node();
  let y = node.y();
  if (pin.isOutput()) {
    y += settings.node.height;
  }

  return {
    x: node.x() + pinOffset(pin.index()),
    y: y
  }
}

function pinOffset(i) {
  return settings.node.pin.margin + i * settings.node.pin.gap;
}

export default class LinkRenderer {
  constructor(canvas, patch) {
    this._canvas = canvas;
    this._patch = patch;
  }

  upsert() {
    this._canvas.selectAll('path.link')
      .data(this._patch.links())
      .each(this.render)
      .enter()
        .append('path')
        .attr('class', 'link')
        .each(this.render);
  }

  render(link) {
    let path = d3.select(this);
    let from = pinPosition(link.from());
    let to = pinPosition(link.to());
    path.attr('d', ['M', from.x, from.y, 'L', to.x, to.y].join(' '));
  }
}
