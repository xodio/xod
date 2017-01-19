export default {
  patches: {
    '@/main': {
      nodes: {
        // blink
        'a/a': {
          id: 'a/a',
          type: 'xod/core/clock',
          pins: {
            interval: {
              injected: true,
              value: 0.2,
            },
          },
        },
        'a/b': {
          id: 'a/b',
          type: 'xod/core/latch',
        },
        'a/generatedNodeId__out': {
          id: 'a/generatedNodeId__out',
          type: 'xod/core/outputNumber',
        },
        // led
        'b/a': {
          id: 'b/a',
          type: 'xod/core/multiply',
        },
        'b/b': {
          id: 'b/b',
          type: 'xod/core/pwm-output',
          pins: {
            'hardware-pin': {
              injected: true,
              value: 13,
            },
          },
        },
      },
      links: {
        // blink
        'a/b': {
          id: 'a/b',
          output: {
            nodeId: 'a/a',
            pinKey: 'tick',
          },
          input: {
            nodeId: 'a/b',
            pinKey: 'toggle',
          },
        },
        // blink to led
        'a-b/c': {
          id: 'a-b/c',
          output: {
            nodeId: 'a/b',
            pinKey: 'out',
          },
          input: {
            nodeId: 'b/a',
            pinKey: 'in1',
          },
        },
        'a-b/d': {
          id: 'a-b/d',
          output: {
            nodeId: 'a/b',
            pinKey: 'out',
          },
          input: {
            nodeId: 'b/a',
            pinKey: 'in2',
          },
        },
        // led
        'b/c': {
          id: 'b/c',
          output: {
            nodeId: 'b/a',
            pinKey: 'out',
          },
          input: {
            nodeId: 'b/b',
            pinKey: 'duty',
          },
        },
      },
    },
    'xod/core/multiply': {
      nodes: {},
      links: {},
      pins: {
        in1: {
          key: 'in1',
          type: 'number',
          direction: 'input',
        },
        in2: {
          key: 'in2',
          type: 'number',
          direction: 'input',
        },
        out: {
          key: 'out',
          type: 'number',
          direction: 'output',
        },
      },
      impls: {
        js: '//ok',
      },
    },
    'xod/core/pwm-output': {
      nodes: {},
      links: {},
      pins: {
        duty: {
          key: 'duty',
          type: 'number',
          direction: 'input',
        },
        'hardware-pin': {
          key: 'hardware-pin',
          type: 'number',
          direction: 'input',
        },
      },
      impls: {
        js: '//ok',
      },
    },
  },
};
