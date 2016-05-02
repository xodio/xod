
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
}

var svg = null;
var patch = null;
var nodeRepository = new AjaxNodeRepository();
var selectedNode = null;

function alignPixel(x) {
  if (Array.isArray(x)) {
    return x.map(alignPixel);
  }

  return Math.floor(x) + 0.5;
}

function pinOffset(i) {
  return settings.node.pin.margin + i * settings.node.pin.gap;
}

function renderInput(pin, i) {
  let g = d3.select(this);
  g.append('circle')
    .attr('r', 4)
    .attr('cx', pinOffset(i));
}

function renderOutput(pin, i) {
  let g = d3.select(this);
  g.append('circle')
    .attr('r', 4)
    .attr('cy', settings.node.height)
    .attr('cx', pinOffset(i));
}

function createNode(node) {
  let g = d3.select(this);

  g.append('rect')
    .attr('class', 'outline')
    .attr('width', settings.node.width)
    .attr('height', settings.node.height);

  g.append('text')
    .text(node.type())
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'central')
    .attr('x', settings.node.width / 2)
    .attr('y', settings.node.height / 2)
    .attr('class', 'title');
}

function renderNode(node) {
  let g = d3.select(this);

  g.attr('transform', 'translate(' + alignPixel(node.x()) + ', ' + alignPixel(node.y()) + ')')
    .classed('selected', node === selectedNode);

  g.selectAll('g.pin.input')
    .data(node.inputs())
    .enter()
      .append('g')
      .attr('class', 'pin input')
      .each(renderInput);

  g.selectAll('g.pin.output')
    .data(node.outputs())
    .enter()
      .append('g')
      .attr('class', 'pin output')
      .each(renderOutput);
}

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

function renderLink(link) {
  let path = d3.select(this);

  let from = pinPosition(link.from());
  let to = pinPosition(link.to());

  path.attr('d', ['M', from.x, from.y, 'L', to.x, to.y].join(' '));
}

function renderPatch() {
  let nodeDrag = d3.behavior.drag()
    .origin(node => node.pos())
    .on('drag', handleNodeDrag);

  let nodes = svg.selectAll("g.node")
    .data(patch.nodes())
    .enter()
      .append("g")
      .attr('class', 'node')
      .each(createNode)
      .each(renderNode)
      .call(nodeDrag)
      .on('click', handleNodeClick);

  svg.selectAll('path.link')
    .data(patch.links())
    .enter()
      .append('path')
      .attr('class', 'link')
      .each(renderLink)
}

function handleNodeDrag(node) {
  let g = d3.select(this);

  node.pos({
    x: d3.event.x,
    y: d3.event.y
  });

  g.attr('transform', 'translate(' + alignPixel(d3.event.x) + ', ' + alignPixel(d3.event.y) + ')');
  svg.selectAll('path.link').each(renderLink);
}

function handleNodeClick(node) {
  selectedNode = node;
  d3.selectAll("g.node").each(renderNode);
}

function render() {
  d3.json("/examples/" + example + ".json", function(json) {
    nodeRepository.prefetch(Patch.nodeTypes(json), function(err) {
      patch = new Patch(json);
      var body = d3.select("body");

      svg = body.append('svg')
        .attr('id', 'canvas')
        .attr('width', 1920)
        .attr('height', 1080);

      renderPatch();
    });
  });
};
