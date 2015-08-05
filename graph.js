
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
            'press',
            'release',
        ],
    }
}

var nodes = [{
    type: 'button',

    x: 10,
    y: 10,
}]


function nodeHeight(node) {
    var ntype = nodeTypes[node.type];
    var pcount = Math.max(ntype.inputs.length, ntype.outputs.length);
    return settings.node.title.height +
        2 * settings.node.endpoint.vmargin +
        (pcount - 1) * settings.node.endpoint.step;
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
            (Math.floor(d.x) + 0.5) + ', ' +
            (Math.floor(d.y) + 0.5) + ')';
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

$(function() {
    var body = d3.select("body");

    var svg = body.append('svg')
        .attr('id', 'canvas')
        .attr('height', 600)
        .attr('width', 600);

    var node = svg.selectAll("g.node")
        .data(nodes)
        .enter().append("g").attr('class', 'node');

    buildNode(node);
});
