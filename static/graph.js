
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

function renderNode(node) {
  var g = d3.select(this);
  var ui = patch.uiOf(node);
  var nodeType = patch.typeOf(node);

  g.attr('transform', 'translate(' + alignPixel(ui.x) + ', ' + alignPixel(ui.y) + ')');

  g.append('rect')
    .attr('class', 'outline')
    .attr('width', settings.node.width)
    .attr('height', settings.node.height);

  g.append('text')
    .text(node.type)
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'central')
    .attr('x', settings.node.width / 2)
    .attr('y', settings.node.height / 2)
    .attr('class', 'title');

  g.selectAll('g.pin.input')
    .data(nodeType.inputs || [])
    .enter()
      .append('g')
      .attr('class', 'pin input')
      .each(renderInput);

  g.selectAll('g.pin.output')
    .data(nodeType.outputs || [])
    .enter()
      .append('g')
      .attr('class', 'pin output')
      .each(renderOutput);
}

function renderLink(link) {
  let path = d3.select(this);

  let fromNodeUI = patch.uiOf(link.fromNode);
  let toNodeUI = patch.uiOf(link.toNode);
  let outputIndex = patch.outputIndex(link.fromNode, link.fromOutput);
  let inputIndex = patch.inputIndex(link.toNode, link.toInput);
  
  let sx = fromNodeUI.x + pinOffset(outputIndex);
  let sy = fromNodeUI.y + settings.node.height;

  let ex = toNodeUI.x + pinOffset(inputIndex);
  let ey = toNodeUI.y;

  path.attr('d', ['M', sx, sy, 'L', ex, ey].join(' '));
}

function renderPatch() {
  let nodeDrag = d3.behavior.drag()
    .origin((node) => patch.uiOf(node))
    .on('drag', handleNodeDrag);

  let nodes = svg.selectAll("g.node")
    .data(patch.nodes)
    .enter()
      .append("g")
      .attr('class', 'node')
      .each(renderNode)
      .call(nodeDrag);

  svg.selectAll('path.link')
    .data(patch.links)
    .enter()
      .append('path')
      .attr('class', 'link')
      .each(renderLink)
}

function handleNodeDrag(node) {
  let g = d3.select(this);
  let ui = patch.uiOf(node);
  ui.x = d3.event.x;
  ui.y = d3.event.y;
  g.attr('transform', 'translate(' + alignPixel(ui.x) + ', ' + alignPixel(ui.y) + ')');
  svg.selectAll('path.link').each(renderLink);
}

function render() {
  d3.json("/examples/" + example + ".json", function(json) {
    patch = Patch.wrap(json);

    var nodeTypes = patch.nodes.map(function(x) { return x.type; });
    nodeRepository.prefetch(nodeTypes, function(err) {
      var body = d3.select("body");

      svg = body.append('svg')
        .attr('id', 'canvas')
        .attr('width', 1920)
        .attr('height', 1080);

      renderPatch();
    });
  });
};
