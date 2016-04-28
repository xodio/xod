
var nodeTypes = {
    button: {
        title: 'Button',
        kind: 'hardware',
        inputs: [
            {name: 'enabled', type: 'bool'},
        ],
        outputs: [
            {name: 'down', type: 'bool'},
            {name: 'press', type: 'pulse'},
            {name: 'release', type: 'pulse'},
        ],
    },

    led: {
        title: 'Led',
        kind: 'hardware',
        inputs: [
            {name: 'enabled', type: 'bool'},
            {name: 'brightness', type: 'number'},
        ],
        outputs: [
        ],
    },

    switch: {
        title: 'Switch',
        kind: 'logic',
        inputs: [
            {name: 'toggle', type: 'pulse'},
            {name: 'set', type: 'pulse'},
            {name: 'reset', type: 'pulse'},
        ],
        outputs: [
            {name: 'output', type: 'bool'},
        ],
    },

    pot: {
        title: 'Pot',
        kind: 'hardware',
        inputs: [
            {name: 'enabled', type: 'bool'},
        ],
        outputs: [
            {name: 'value', type: 'number'},
        ],
    },

    servo: {
        title: 'Servo',
        kind: 'hardware',
        inputs: [
            {name: 'enabled', type: 'bool'},
            {name: 'angle', type: 'number'},
        ],
        outputs: [
        ],
    },

    buzzer: {
        title: 'Buzzer',
        kind: 'hardware',
        inputs: [
            {name: 'enabled', type: 'bool'},
            {name: 'frequency', type: 'number'},
        ],
        outputs: [
        ],
    },

    branch: {
        title: 'Branch',
        kind: 'logic',
        inputs: [
            {name: 'input', type: 'bool'},
            {name: 'if_true', type: 'number'},
            {name: 'if_false', type: 'number'},
        ],
        outputs: [
            {name: 'output', type: 'number'},
        ],
    },

    timer: {
        title: 'Timer',
        kind: 'generator',
        inputs: [
            {name: 'enabled', type: 'bool'},
            {name: 'interval', type: 'number'},
        ],
        outputs: [
            {name: 'tick', type: 'pulse'},
        ],
    },

    mapper: {
        title: 'Mapper',
        kind: 'logic',
        inputs: [
            {name: 'in', type: 'number'},
            {name: 'in_min', type: 'number'},
            {name: 'in_max', type: 'number'},
            {name: 'out_min', type: 'number'},
            {name: 'out_max', type: 'number'},
            {name: 'clamp', type: 'bool'},
        ],
        outputs: [
            {name: 'out', type: 'number'},
        ],
    },

    binComparator: {
        title: 'Comparator',
        kind: 'logic',
        inputs: [
            {name: 'in', type: 'number'},
            {name: 'threshold', type: 'number'},
        ],
        outputs: [
            {name: 'less', type: 'bool'},
            {name: 'equal', type: 'bool'},
            {name: 'greater', type: 'bool'},
        ],
    },

    lightSensor: {
        title: 'Light Sensor',
        kind: 'hardware',
        inputs: [
            {name: 'enabled', type: 'bool'},
        ],
        outputs: [
            {name: 'value', type: 'number'},
        ],
    },

    gprs: {
        title: 'GPRS',
        kind: 'hardware',
        inputs: [],
        outputs: [
            {name: 'got_sms', type: 'pulse'},
            {name: 'message', type: 'number'},
        ],
    },

    ws281x: {
        title: 'WS281x Leds',
        kind: 'hardware',
        inputs: [
            {name: 'red', type: 'number'},
            {name: 'green', type: 'number'},
            {name: 'blue', type: 'number'},
            {name: 'index', type: 'number'},
            {name: 'push', type: 'pulse'},
        ],
        outputs: [],
    },

    counter: {
        title: 'Counter',
        kind: 'logic',
        inputs: [
            {name: 'reset', type: 'pulse'},
            {name: 'increment', type: 'pulse'},
        ],
        outputs: [
            {name: 'value', type: 'number'},
        ],
    },

    rangeCheck: {
        title: 'Range Check',
        kind: 'logic',
        inputs: [
            {name: 'in', type: 'number'},
            {name: 'range_min', type: 'number'},
            {name: 'range_max', type: 'number'},
        ],
        outputs: [
            {name: 'between', type: 'bool'},
            {name: 'less', type: 'bool'},
            {name: 'greater', type: 'bool'},
        ],
    },

    pulseFilter: {
        title: 'Pulse Filter',
        kind: 'logic',
        inputs: [
            {name: 'in', type: 'pulse'},
            {name: 'pass', type: 'bool'},
        ],
        outputs: [
            {name: 'out', type: 'pulse'},
        ],
    },

    hsbToRgb: {
        title: 'HSB to RGB',
        kind: 'logic',
        inputs: [
            {name: 'hue', type: 'number'},
            {name: 'saturation', type: 'number'},
            {name: 'brightness', type: 'number'},
        ],
        outputs: [
            {name: 'red', type: 'number'},
            {name: 'green', type: 'number'},
            {name: 'blue', type: 'number'},
        ],
    },
}
