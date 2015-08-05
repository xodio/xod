
var settings = {
    node: {
        width: 150,

        title: {
            height: 30,
        },

        endpoint: {
            radius: 3,
            step: 15,
            vmargin: 15,
            hpadding: 10,
        },
    }
}

var nodeTypes = {
    button: {
        title: 'Button',
        inputs: [
            'enabled',
        ],
        outputs: [
            'down',
            'press',
            'release',
        ],
    },

    led: {
        title: 'Led',
        inputs: [
            'enabled',
            'brightness',
        ],
        outputs: [
        ],
    }
}

var nodes = {
    button: {
        type: 'button',
        x: 10,
        y: 10,
    },

    led: {
        type: 'led',
        x: 250,
        y: 10,
    },
}

var links = [{
    fromNode: 'button',
    fromOutput: 'down',
    toNode: 'led',
    toInput: 'enabled',
}]

function alignPixel(x) {
    if (Array.isArray(x)) {
        return x.map(alignPixel);
    }

    return Math.floor(x) + 0.5;
}

function nodeHeight(node) {
    var ntype = nodeTypes[node.type];
    var pcount = Math.max(ntype.inputs.length, ntype.outputs.length);
    return settings.node.title.height +
        2 * settings.node.endpoint.vmargin +
        (pcount - 1) * settings.node.endpoint.step;
}

function inputPosition(node, endpointName) {
    var ntype = nodeTypes[node.type];
    var idx = ntype.inputs.indexOf(endpointName);
    return alignPixel([
        node.x,
        node.y + settings.node.title.height + settings.node.endpoint.vmargin + idx * settings.node.endpoint.step
    ]);
}

function outputPosition(node, endpointName) {
    var ntype = nodeTypes[node.type];
    var idx = ntype.outputs.indexOf(endpointName);
    return alignPixel([
        node.x + settings.node.width,
        node.y + settings.node.title.height + settings.node.endpoint.vmargin + idx * settings.node.endpoint.step
    ]);
}

function buildEndpoint(g, x, labelDx, labelAnchor) {
    var yBase = settings.node.title.height +
                settings.node.endpoint.vmargin;

    calcY = function(d, i) {
        return yBase + i * settings.node.endpoint.step;
    }

    g.append('circle')
        .attr('cx', x)
        .attr('cy', calcY)
        .attr('r', settings.node.endpoint.radius)
        .attr('fill', 'black');

    g.append('text')
        .text(function(d) { return d; })
        .attr('text-anchor', labelAnchor)
        .attr('dominant-baseline', 'central')
        .attr('x', x + labelDx)
        .attr('y', calcY);
}

function buildInput(g) {
    buildEndpoint(g, 0, settings.node.endpoint.hpadding, 'start');
}

function buildOutput(g) {
    buildEndpoint(g, settings.node.width,
                  -settings.node.endpoint.hpadding, 'end');
}

function buildNode(g) {
    g.attr('transform', function(d) {
        return 'translate(' +
            alignPixel(d.x) + ', ' +
            alignPixel(d.y) + ')';
    });

    g.append('rect')
        .attr('class', 'outline')
        .attr('width', settings.node.width)
        .attr('height', function(d) { return nodeHeight(d); })

    g.append('text')
        .text(function(d) { return nodeTypes[d.type].title; })
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .attr('x', settings.node.width / 2)
        .attr('y', settings.node.title.height / 2)
        .attr('class', 'title')

    g.append('path')
        .attr('class', 'outline')
        .attr('d', 'm 0 ' + settings.node.title.height + ' h ' + settings.node.width)

    var input = g.selectAll('g.input')
        .data(function(d) { return nodeTypes[d.type].inputs; })
        .enter().append('g').attr('class', 'endpoint input');

    buildInput(input);

    var output = g.selectAll('g.output')
        .data(function(d) { return nodeTypes[d.type].outputs; })
        .enter().append('g').attr('class', 'endpoint output');

    buildOutput(output);
}

function buildLink(path) {
    path.attr('d', function(d) {
        var points = [
            outputPosition(nodes[d.fromNode], d.fromOutput),
            inputPosition(nodes[d.toNode], d.toInput),
        ];

        return d3.svg.line()(points) + 'Z';
    });
}

$(function() {
    var body = d3.select("body");

    var svg = body.append('svg')
        .attr('id', 'canvas')
        .attr('height', 600)
        .attr('width', 600);

    var node = svg.selectAll("g.node")
        .data(d3.values(nodes))
        .enter().append("g").attr('class', 'node');

    buildNode(node);

    var link = svg.selectAll("path.link")
        .data(links)
        .enter().append("path").attr('class', 'link');

    buildLink(link);
});
