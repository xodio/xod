
var settings = {
    node: {
        width: 150,

        title: {
            height: 30,
        },

        endpoint: {
            radius: 3,
            step: 10,
            vmargin: 20,
        },
    }
}

var nodes = [{
    title: 'Button',

    x: 10,
    y: 10,

    inputs: [{
        title: 'enabled'
    }],

    outputs: [{
        title: 'press'
    }, {
        title: 'release'
    }],
}]


function nodeHeight(node) {
    var pcount = Math.max(node.inputs.length, node.outputs.length);
    return settings.node.title.height +
        2 * settings.node.endpoint.vmargin +
        (pcount - 1) * settings.node.endpoint.step;
}


function buildNode(g) {
    g.attr('transform', function(d) {
        return 'translate(' + d.x + ', ' + d.y + ')';
    });

    g.append('rect')
        .attr('width', settings.node.width)
        .attr('height', function(d) { return nodeHeight(d); })
        .attr('fill', 'white')
        .attr('stroke', 'blue')

    g.append('text')
        .text(function(d) { return d.title; })
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .attr('x', settings.node.width / 2)
        .attr('y', settings.node.title.height / 2)
        .attr('class', 'title')

    g.append('path')
        .attr('d', 'm 0 ' + settings.node.title.height + ' h ' + settings.node.width)
        .attr('stroke', 'blue');

    g.append('circle')
        .attr('cx', 0)
        .attr('cy', 45)
        .attr('r', 3)
        .attr('fill', 'black');

    g.append('text')
        .text('enabled')
        .attr('class', 'endpoint')
        .attr('dominant-baseline', 'central')
        .attr('x', 10)
        .attr('y', 45)
}

$(function() {
    var body = d3.select("body");

    var svg = body.append('svg')
        .attr('height', 600)
        .attr('width', 600);

    var node = svg.selectAll("g.node")
        .data(nodes)
        .enter().append("g").attr('class', 'node');

    buildNode(node);
});
