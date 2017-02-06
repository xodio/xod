export default {
  patches: {
    '@/main': {
      nodes: {
        a: {
          id: 'a',
          type: '@/blink',
          pins: {
            generatedNodeId__interval: {
              injected: true,
              value: 0.2,
            },
          },
        },
        b: {
          id: 'b',
          type: 'xod/core/led',
          pins: {
            generatedNodeId__hardwarePin: {
              injected: true,
              value: 13,
            },
          },
        },
      },
      links: {
        a: {
          id: 'a',
          output: {
            nodeId: 'a',
            pinKey: 'generatedNodeId__out',
          },
          input: {
            nodeId: 'b',
            pinKey: 'generatedNodeId__interval',
          },
        },
      },
    },
    '@/blink': {
      nodes: {
        generatedNodeId__interval: {
          id: 'generatedNodeId__interval',
          type: 'xod/core/inputNumber',
        },
        a: {
          id: 'a',
          type: 'xod/core/clock',
        },
        b: {
          id: 'b',
          type: 'xod/core/latch',
        },
        generatedNodeId__out: {
          id: 'generatedNodeId__out',
          type: 'xod/core/outputNumber',
        },
      },
      links: {
        a: {
          id: 'a',
          output: {
            nodeId: 'generatedNodeId__interval',
            pinKey: 'out',
          },
          input: {
            nodeId: 'a',
            pinKey: 'interval',
          },
        },
        b: {
          id: 'b',
          output: {
            nodeId: 'a',
            pinKey: 'tick',
          },
          input: {
            nodeId: 'b',
            pinKey: 'toggle',
          },
        },
        c: {
          id: 'c',
          output: {
            nodeId: 'b',
            pinKey: 'out',
          },
          input: {
            nodeId: 'generatedNodeId__out',
            pinKey: 'in',
          },
        },
      },
      pins: {
        generatedNodeId__interval: {
          key: 'generatedNodeId__interval',
          type: 'number',
          direction: 'input',
        },
        generatedNodeId__out: {
          key: 'generatedNodeId__out',
          type: 'number',
          direction: 'output',
        },
      },
    },
    'xod/core/led': {
      nodes: {
        generatedNodeId__brightness: {
          id: 'generatedNodeId__brightness',
          type: 'xod/core/inputNumber',
        },
        generatedNodeId__hardwarePin: {
          id: 'generatedNodeId__hardwarePin',
          type: 'xod/core/inputNumber',
        },
        a: {
          id: 'a',
          type: 'xod/core/multiply',
        },
        b: {
          id: 'b',
          type: 'xod/core/pwm-output',
        },
      },
      links: {
        a: {
          id: 'a',
          output: {
            nodeId: 'generatedNodeId__brightness',
            pinKey: 'out',
          },
          input: {
            nodeId: 'a',
            pinKey: 'in1',
          },
        },
        b: {
          id: 'b',
          output: {
            nodeId: 'generatedNodeId__brightness',
            pinKey: 'out',
          },
          input: {
            nodeId: 'a',
            pinKey: 'in2',
          },
        },
        c: {
          id: 'c',
          output: {
            nodeId: 'a',
            pinKey: 'out',
          },
          input: {
            nodeId: 'b',
            pinKey: 'duty',
          },
        },
        d: {
          id: 'd',
          output: {
            nodeId: 'generatedNodeId__hardwarePin',
            pinKey: 'out',
          },
          input: {
            nodeId: 'b',
            pinKey: 'hardware-pin',
          },
        },
      },
      pins: {
        generatedNodeId__brightness: {
          key: 'generatedNodeId__brightness',
          type: 'number',
          direction: 'input',
        },
        generatedNodeId__hardwarePin: {
          key: 'generatedNodeId__hardwarePin',
          type: 'string',
          direction: 'input',
        },
      },
    },
    'xod/core/inputNumber': {
      nodes: {},
      links: {},
      pins: {
        out: {
          key: 'out',
          type: 'number',
          direction: 'output',
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
    'xod/core/or': {
      nodes: {},
      links: {},
      impls: {
        js: '//ok',
      },
    },
  },
};
