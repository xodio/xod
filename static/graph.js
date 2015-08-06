
var settings = {
    node: {
        width: 150,

        title: {
            height: 30,
        },

        endpoint: {
            radius: 3.5,
            step: 15,
            vmargin: 15,
            hpadding: 10,
        },
    }
}

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

function endpointPosition(node, endpointName, endpointsField) {
    var ntype = nodeTypes[node.type];
    var endpointNames = ntype[endpointsField].map(function(ep) {
        return ep.name;
    });

    var idx = endpointNames.indexOf(endpointName);
    return alignPixel([
        node.x + ((endpointsField == 'outputs') ? settings.node.width : 0),
        node.y + settings.node.title.height + settings.node.endpoint.vmargin + idx * settings.node.endpoint.step
    ]);
}

function buildEndpoint(g, dir, type) {
    var isOutput = (dir == 'output');
    var x = isOutput ? settings.node.width : 0;
    var labelDx = (isOutput ? -1 : 1) * settings.node.endpoint.hpadding;
    var labelAnchor = isOutput ? 'end' : 'start';

    var yBase = settings.node.title.height +
                settings.node.endpoint.vmargin;

    var r = settings.node.endpoint.radius;

    calcY = function(d) {
        return yBase + d.index * settings.node.endpoint.step;
    }

    g.attr('class', 'endpoint ' + dir + ' ' + type);

    if (type == 'number') {
        g.append('circle')
            .attr('cx', x)
            .attr('cy', calcY)
            .attr('r', r)
    } else if (type == 'pulse') {
        var ex = x + r / 2;
        g.append('path')
            .attr('d', d3.svg.symbol().type('triangle-down').size(Math.PI * r * r))
            .attr('transform', function(d) {
                return 'translate(' + ex + ', ' + calcY(d) + ') rotate(-90)';
            });
    } else if (type == 'bool') {
        var s = Math.sqrt(Math.PI) * r;
        g.append('rect')
            .attr('x', x - s / 2)
            .attr('y', function(d) { return calcY(d) - s / 2; })
            .attr('width', s)
            .attr('height', s)
    }

    g.append('text')
        .attr('text-anchor', labelAnchor)
        .attr('dominant-baseline', 'central')
        .attr('x', x + labelDx)
        .attr('y', calcY)
        .text(function(d) {
            var label = d.name;
            var hasOpts = (d.value !== undefined) || (d.unit !== undefined);
            if (hasOpts) {
                label += ' [';
                if (d.value !== undefined) { label += '=' + d.value; }
                if (d.unit  !== undefined) { label += d.unit; }
                label += ']';
            }

            return label;
        });
}

function buildNode(g) {
    g.attr('class', function(d) { return 'node ' + (nodeTypes[d.type].kind || ''); });

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
        .attr('d', 'm 0 ' + settings.node.title.height + ' h ' + settings.node.width);

    ['input', 'output'].forEach(function(dir) {
        ['bool', 'number', 'pulse'].forEach(function(type) {
            var endpoint = g.selectAll('g.endpoint.' + dir + '.' + type)
                .data(function(d) {
                    var endpoints = nodeTypes[d.type][dir + 's'];
                    var endpointOptions = d[dir + 's'];
                    return endpoints.filter(function(ep) {
                        return ep.type == type;
                    }).map(function(ep) {
                        ep.index = endpoints.indexOf(ep);
                        if (endpointOptions) {
                            Object.assign(ep, endpointOptions[ep.name] || {});
                        }
                        return ep;
                    });
                }).enter()
                    .append('g');

            buildEndpoint(endpoint, dir, type);
        });
    });
}

function buildLink(path, nodes) {
    path.attr('d', function(d) {
        var points = [
            endpointPosition(nodes[d.fromNode], d.fromOutput, 'outputs'),
            endpointPosition(nodes[d.toNode], d.toInput, 'inputs'),
        ];

        var sx = points[0][0];
        var sy = points[0][1];
        var ex = points[1][0];
        var ey = points[1][1];
        var cx = sx + (ex - sx) / 2;

        return 'M ' + sx + ' ' + sy + ' C ' +
            cx + ' ' + sy + ', ' +
            cx + ' ' + ey + ', ' +
            ex + ' ' + ey + '';
    });
}

function visualize() {
    d3.json("/data/" + datum + ".json", function(json) {
        var nodes = json.nodes;
        var links = json.links;

        var body = d3.select("body");

        var svg = body.append('svg')
            .attr('id', 'canvas')
            .attr('height', 1080)
            .attr('width', 1920);

        var node = svg.selectAll("g.node")
            .data(d3.values(nodes))
            .enter().append("g").attr('class', 'node');

        buildNode(node);

        var link = svg.selectAll("path.link")
            .data(links)
            .enter().append("path").attr('class', 'link');

        buildLink(link, nodes);
    });
};
