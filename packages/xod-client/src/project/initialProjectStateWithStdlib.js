export default {
  authors: [
    'Amperka team',
  ],
  description: '',
  license: '',
  name: 'Awesome project',
  patches: {
    '@/1': {
      impls: {},
      links: {},
      nodes: {},
      path: '@/1',
    },
    '@/2': {
      impls: {},
      links: {},
      nodes: {},
      path: '@/2',
    },
    'xod/core/and': {
      impls: {
        js: '\nmodule.exports.evaluate = function(e) {\n  return { out: e.inputs.a && e.inputs.b };\n};\n',
      },
      links: {},
      nodes: {
        noNativeImpl: {
          description: '',
          id: 'noNativeImpl',
          label: '',
          position: {
            x: 100,
            y: 100,
          },
          type: 'xod/patch-nodes/not-implemented-in-xod',
        },
        a: {
          id: 'a',
          type: 'xod/patch-nodes/input-boolean',
          position: {
            x: 0,
            y: 0,
          },
          label: '',
          description: '',
        },
        b: {
          id: 'b',
          type: 'xod/patch-nodes/input-boolean',
          position: {
            x: 200,
            y: 0,
          },
          label: '',
          description: '',
        },
        out: {
          id: 'out',
          type: 'xod/patch-nodes/output-boolean',
          position: {
            x: 0,
            y: 300,
          },
          label: '',
          description: '',
        },
      },
      path: 'xod/core/and',
    },
    'xod/core/any': {
      impls: {
        js: '\nmodule.exports.evaluate = function(e) {\n  if (e.inputs.a || e.inputs.b) {\n    return { out: PULSE };\n  }\n};\n',
      },
      links: {},
      nodes: {
        noNativeImpl: {
          description: '',
          id: 'noNativeImpl',
          label: '',
          position: {
            x: 100,
            y: 100,
          },
          type: 'xod/patch-nodes/not-implemented-in-xod',
        },
        a: {
          id: 'a',
          type: 'xod/patch-nodes/input-pulse',
          position: {
            x: 0,
            y: 0,
          },
          label: '',
          description: '',
        },
        b: {
          id: 'b',
          type: 'xod/patch-nodes/input-pulse',
          position: {
            x: 200,
            y: 0,
          },
          label: '',
          description: '',
        },
        out: {
          id: 'out',
          type: 'xod/patch-nodes/output-pulse',
          position: {
            x: 0,
            y: 300,
          },
          label: '',
          description: '',
        },
      },
      path: 'xod/core/any',
    },
    'xod/core/blink': {
      impls: {},
      links: {
        BygxthGNqae: {
          id: 'BygxthGNqae',
          input: {
            nodeId: 'B1zOhGEqax',
            pinKey: '__in__',
          },
          output: {
            nodeId: 'SJbd3z45ag',
            pinKey: 'state',
          },
        },
        'Hk-lY2MEcpl': {
          id: 'Hk-lY2MEcpl',
          input: {
            nodeId: 'Sye_2f45ax',
            pinKey: 'interval',
          },
          output: {
            nodeId: 'Sku3GVq6e',
            pinKey: '__out__',
          },
        },
        rkzlt2MVcTe: {
          id: 'rkzlt2MVcTe',
          input: {
            nodeId: 'SJbd3z45ag',
            pinKey: 'toggle',
          },
          output: {
            nodeId: 'Sye_2f45ax',
            pinKey: 'tick',
          },
        },
      },
      nodes: {
        B1zOhGEqax: {
          id: 'B1zOhGEqax',
          pins: {},
          position: {
            x: 263,
            y: 508,
          },
          type: 'xod/core/output-boolean',
        },
        SJbd3z45ag: {
          id: 'SJbd3z45ag',
          pins: {},
          position: {
            x: 271,
            y: 355,
          },
          type: 'xod/core/latch',
        },
        Sku3GVq6e: {
          id: 'Sku3GVq6e',
          pins: {},
          position: {
            x: 268,
            y: 103,
          },
          type: 'xod/core/input-number',
        },
        Sye_2f45ax: {
          id: 'Sye_2f45ax',
          pins: {
            interval: {
              curried: false,
              value: 1,
            },
          },
          position: {
            x: 267,
            y: 215,
          },
          type: 'xod/core/clock',
        },
      },
      path: 'xod/core/blink',
    },
    'xod/core/both': {
      impls: {
        js: '\nmodule.exports.evaluate = function(e) {\n  if (e.inputs.a && e.inputs.b) {\n    return { out: PULSE };\n  }\n};\n',
      },
      links: {},
      nodes: {
        noNativeImpl: {
          description: '',
          id: 'noNativeImpl',
          label: '',
          position: {
            x: 100,
            y: 100,
          },
          type: 'xod/patch-nodes/not-implemented-in-xod',
        },
        a: {
          id: 'a',
          type: 'xod/patch-nodes/input-pulse',
          position: {
            x: 0,
            y: 0,
          },
          label: '',
          description: '',
        },
        b: {
          id: 'b',
          type: 'xod/patch-nodes/input-pulse',
          position: {
            x: 200,
            y: 0,
          },
          label: '',
          description: '',
        },
        out: {
          id: 'out',
          type: 'xod/patch-nodes/output-pulse',
          position: {
            x: 0,
            y: 300,
          },
          label: '',
          description: '',
        },
      },
      path: 'xod/core/both',
    },
    'xod/core/button': {
      impls: {
        espruino: "\nmodule.exports.setup = function(e) {\n  var pin = new Pin(e.props.pin);\n\n  setWatch(function(evt) {\n    e.fire({ state: !evt.state });\n  }, pin, {\n    edge: 'both',\n    repeat: true,\n    debounce: 30\n  });\n};\n",
      },
      links: {},
      nodes: {
        noNativeImpl: {
          description: '',
          id: 'noNativeImpl',
          label: '',
          position: {
            x: 100,
            y: 100,
          },
          type: 'xod/patch-nodes/not-implemented-in-xod',
        },
        state: {
          id: 'state',
          type: 'xod/patch-nodes/output-boolean',
          position: {
            x: 0,
            y: 300,
          },
          label: '',
          description: '',
        },
      },
      path: 'xod/core/button',
    },
    'xod/core/buzzer': {
      impls: {
        espruino: '\nmodule.exports.setup = function(e) {\n  e.context.pin = new Pin(e.props.pin);\n};\n\nmodule.exports.evaluate = function(e) {\n  var f = e.inputs.freq;\n\n  if (f === 0) {\n    digitalWrite(e.context.pin, false);\n  } else {\n    analogWrite(e.context.pin, 0.5, { freq: f });\n  }\n};\n',
      },
      links: {},
      nodes: {
        noNativeImpl: {
          description: '',
          id: 'noNativeImpl',
          label: '',
          position: {
            x: 100,
            y: 100,
          },
          type: 'xod/patch-nodes/not-implemented-in-xod',
        },
        freq: {
          id: 'freq',
          type: 'xod/patch-nodes/input-number',
          position: {
            x: 0,
            y: 0,
          },
          label: '',
          description: '',
        },
      },
      path: 'xod/core/buzzer',
    },
    'xod/core/cast-boolean-to-number': {
      impls: {
        cpp: 'struct State {\n};\n\n{{ GENERATED_CODE }}\n\nvoid evaluate(NodeId nid, State* state) {\n    emitNumber(nid, Outputs::__OUT__, getLogic(nid, Inputs::__IN__));\n}\n',
        js: '\nmodule.exports.evaluate = function(e) {\n  return { __out__: Number(e.inputs.__in__) };\n};\n',
      },
      links: {},
      nodes: {
        noNativeImpl: {
          description: '',
          id: 'noNativeImpl',
          label: '',
          position: {
            x: 100,
            y: 100,
          },
          type: 'xod/patch-nodes/not-implemented-in-xod',
        },
        __in__: {
          id: '__in__',
          type: 'xod/patch-nodes/input-boolean',
          position: {
            x: 0,
            y: 0,
          },
          label: '',
          description: '',
        },
        __out__: {
          id: '__out__',
          type: 'xod/patch-nodes/output-number',
          position: {
            x: 0,
            y: 300,
          },
          label: '',
          description: '',
        },
      },
      path: 'xod/core/cast-boolean-to-number',
    },
    'xod/core/cast-boolean-to-pulse': {
      impls: {
        js: '\nmodule.exports.evaluate = function(e) {\n  if (e.inputs.__in__ === false) return;\n  return { __out__: PULSE };\n};\n',
      },
      links: {},
      nodes: {
        noNativeImpl: {
          description: '',
          id: 'noNativeImpl',
          label: '',
          position: {
            x: 100,
            y: 100,
          },
          type: 'xod/patch-nodes/not-implemented-in-xod',
        },
        __in__: {
          id: '__in__',
          type: 'xod/patch-nodes/input-boolean',
          position: {
            x: 0,
            y: 0,
          },
          label: '',
          description: '',
        },
        __out__: {
          id: '__out__',
          type: 'xod/patch-nodes/output-pulse',
          position: {
            x: 0,
            y: 300,
          },
          label: '',
          description: '',
        },
      },
      path: 'xod/core/cast-boolean-to-pulse',
    },
    'xod/core/cast-boolean-to-string': {
      impls: {
        js: '\nmodule.exports.evaluate = function(e) {\n  return { __out__: String(e.inputs.__in__) };\n};\n',
      },
      links: {},
      nodes: {
        noNativeImpl: {
          description: '',
          id: 'noNativeImpl',
          label: '',
          position: {
            x: 100,
            y: 100,
          },
          type: 'xod/patch-nodes/not-implemented-in-xod',
        },
        __in__: {
          id: '__in__',
          type: 'xod/patch-nodes/input-boolean',
          position: {
            x: 0,
            y: 0,
          },
          label: '',
          description: '',
        },
        __out__: {
          id: '__out__',
          type: 'xod/patch-nodes/output-string',
          position: {
            x: 0,
            y: 300,
          },
          label: '',
          description: '',
        },
      },
      path: 'xod/core/cast-boolean-to-string',
    },
    'xod/core/cast-number-to-boolean': {
      impls: {
        cpp: 'struct State {\n};\n\n{{ GENERATED_CODE }}\n\nvoid evaluate(NodeId nid, State* state) {\n    emitLogic(nid, Outputs::__OUT__, getNumber(nid, Inputs::__IN__));\n}\n',
        js: '\nmodule.exports.evaluate = function(e) {\n  return { __out__: Boolean(e.inputs.__in__) };\n};\n',
      },
      links: {},
      nodes: {
        noNativeImpl: {
          description: '',
          id: 'noNativeImpl',
          label: '',
          position: {
            x: 100,
            y: 100,
          },
          type: 'xod/patch-nodes/not-implemented-in-xod',
        },
        __in__: {
          id: '__in__',
          type: 'xod/patch-nodes/input-number',
          position: {
            x: 0,
            y: 0,
          },
          label: '',
          description: '',
        },
        __out__: {
          id: '__out__',
          type: 'xod/patch-nodes/output-boolean',
          position: {
            x: 0,
            y: 300,
          },
          label: '',
          description: '',
        },
      },
      path: 'xod/core/cast-number-to-boolean',
    },
    'xod/core/cast-number-to-pulse': {
      impls: {
        js: '\nmodule.exports.evaluate = function(e) {\n  if (Boolean(e.inputs.__in__) === false) return;\n\n  return { __out__: PULSE };\n};\n',
      },
      links: {},
      nodes: {
        noNativeImpl: {
          description: '',
          id: 'noNativeImpl',
          label: '',
          position: {
            x: 100,
            y: 100,
          },
          type: 'xod/patch-nodes/not-implemented-in-xod',
        },
        __in__: {
          id: '__in__',
          type: 'xod/patch-nodes/input-number',
          position: {
            x: 0,
            y: 0,
          },
          label: '',
          description: '',
        },
        __out__: {
          id: '__out__',
          type: 'xod/patch-nodes/output-pulse',
          position: {
            x: 0,
            y: 300,
          },
          label: '',
          description: '',
        },
      },
      path: 'xod/core/cast-number-to-pulse',
    },
    'xod/core/cast-number-to-string': {
      impls: {
        js: '\nmodule.exports.evaluate = function(e) {\n  return { __out__: String(e.inputs.__in__) };\n};\n',
      },
      links: {},
      nodes: {
        noNativeImpl: {
          description: '',
          id: 'noNativeImpl',
          label: '',
          position: {
            x: 100,
            y: 100,
          },
          type: 'xod/patch-nodes/not-implemented-in-xod',
        },
        __in__: {
          id: '__in__',
          type: 'xod/patch-nodes/input-number',
          position: {
            x: 0,
            y: 0,
          },
          label: '',
          description: '',
        },
        __out__: {
          id: '__out__',
          type: 'xod/patch-nodes/output-boolean',
          position: {
            x: 0,
            y: 300,
          },
          label: '',
          description: '',
        },
      },
      path: 'xod/core/cast-number-to-string',
    },
    'xod/core/cast-pulse-to-boolean': {
      impls: {
        js: '\nmodule.exports.evaluate = function(e) {\n  return { __out__: true };\n};\n',
      },
      links: {},
      nodes: {
        noNativeImpl: {
          description: '',
          id: 'noNativeImpl',
          label: '',
          position: {
            x: 100,
            y: 100,
          },
          type: 'xod/patch-nodes/not-implemented-in-xod',
        },
        __in__: {
          id: '__in__',
          type: 'xod/patch-nodes/input-pulse',
          position: {
            x: 0,
            y: 0,
          },
          label: '',
          description: '',
        },
        __out__: {
          id: '__out__',
          type: 'xod/patch-nodes/output-boolean',
          position: {
            x: 0,
            y: 300,
          },
          label: '',
          description: '',
        },
      },
      path: 'xod/core/cast-pulse-to-boolean',
    },
    'xod/core/cast-pulse-to-number': {
      impls: {
        js: '\nmodule.exports.evaluate = function(e) {\n  return { __out__: 1 };\n};\n',
      },
      links: {},
      nodes: {
        noNativeImpl: {
          description: '',
          id: 'noNativeImpl',
          label: '',
          position: {
            x: 100,
            y: 100,
          },
          type: 'xod/patch-nodes/not-implemented-in-xod',
        },
        __in__: {
          id: '__in__',
          type: 'xod/patch-nodes/input-pulse',
          position: {
            x: 0,
            y: 0,
          },
          label: '',
          description: '',
        },
        __out__: {
          id: '__out__',
          type: 'xod/patch-nodes/output-number',
          position: {
            x: 0,
            y: 300,
          },
          label: '',
          description: '',
        },
      },
      path: 'xod/core/cast-pulse-to-number',
    },
    'xod/core/cast-string-to-boolean': {
      impls: {
        js: '\nmodule.exports.evaluate = function(e) {\n  return { __out__: Boolean(e.inputs.__in__) };\n};\n',
      },
      links: {},
      nodes: {
        noNativeImpl: {
          description: '',
          id: 'noNativeImpl',
          label: '',
          position: {
            x: 100,
            y: 100,
          },
          type: 'xod/patch-nodes/not-implemented-in-xod',
        },
        __in__: {
          id: '__in__',
          type: 'xod/patch-nodes/input-string',
          position: {
            x: 0,
            y: 0,
          },
          label: '',
          description: '',
        },
        __out__: {
          id: '__out__',
          type: 'xod/patch-nodes/output-boolean',
          position: {
            x: 0,
            y: 300,
          },
          label: '',
          description: '',
        },
      },
      path: 'xod/core/cast-string-to-boolean',
    },
    'xod/core/cast-string-to-pulse': {
      impls: {
        js: '\nmodule.exports.evaluate = function(e) {\n  if (Boolean(e.inputs.__in__) === false) return;\n\n  return { __out__: PULSE };\n};\n',
      },
      links: {},
      nodes: {
        noNativeImpl: {
          description: '',
          id: 'noNativeImpl',
          label: '',
          position: {
            x: 100,
            y: 100,
          },
          type: 'xod/patch-nodes/not-implemented-in-xod',
        },
        __in__: {
          id: '__in__',
          type: 'xod/patch-nodes/input-string',
          position: {
            x: 0,
            y: 0,
          },
          label: '',
          description: '',
        },
        __out__: {
          id: '__out__',
          type: 'xod/patch-nodes/output-pulse',
          position: {
            x: 0,
            y: 300,
          },
          label: '',
          description: '',
        },
      },
      path: 'xod/core/cast-string-to-pulse',
    },
    'xod/core/choose': {
      impls: {
        js: '\nmodule.exports.evaluate = function(e) {\n  if (e.inputs.x) {\n    return { truePulse: PULSE };\n  } else {\n    return { falsePulse: PULSE };\n  }\n};\n',
      },
      links: {},
      nodes: {
        noNativeImpl: {
          description: '',
          id: 'noNativeImpl',
          label: '',
          position: {
            x: 100,
            y: 100,
          },
          type: 'xod/patch-nodes/not-implemented-in-xod',
        },
        falsePulse: {
          id: 'falsePulse',
          type: 'xod/patch-nodes/output-pulse',
          position: {
            x: 200,
            y: 300,
          },
          label: '',
          description: '',
        },
        truePulse: {
          id: 'truePulse',
          type: 'xod/patch-nodes/output-pulse',
          position: {
            x: 0,
            y: 300,
          },
          label: '',
          description: '',
        },
        x: {
          id: 'x',
          type: 'xod/patch-nodes/input-boolean',
          position: {
            x: 0,
            y: 0,
          },
          label: '',
          description: '',
        },
      },
      path: 'xod/core/choose',
    },
    'xod/core/choose-range': {
      impls: {},
      links: {
        BJIgthfVqpx: {
          id: 'BJIgthfVqpx',
          input: {
            nodeId: 'BJHu2GV5al',
            pinKey: '__in__',
          },
          output: {
            nodeId: 'r14dnfE9al',
            pinKey: 'truePulse',
          },
        },
        BkreYhfVc6e: {
          id: 'BkreYhfVc6e',
          input: {
            nodeId: 'r14dnfE9al',
            pinKey: 'x',
          },
          output: {
            nodeId: 'H1PuhzVcax',
            pinKey: 'out',
          },
        },
        HJXxthMN9Tg: {
          id: 'HJXxthMN9Tg',
          input: {
            nodeId: 'H1PuhzVcax',
            pinKey: 'b',
          },
          output: {
            nodeId: 'rk__hGVcpe',
            pinKey: '__out__',
          },
        },
        HyNgF3f45pg: {
          id: 'HyNgF3f45pg',
          input: {
            nodeId: 'H1PuhzVcax',
            pinKey: 'a',
          },
          output: {
            nodeId: 'rk7unMVqpx',
            pinKey: '__out__',
          },
        },
        S1Pxt3G45Te: {
          id: 'S1Pxt3G45Te',
          input: {
            nodeId: 'B1Iu3fV9pe',
            pinKey: '__in__',
          },
          output: {
            nodeId: 'r14dnfE9al',
            pinKey: 'falsePulse',
          },
        },
      },
      nodes: {
        B1Iu3fV9pe: {
          id: 'B1Iu3fV9pe',
          pins: {},
          position: {
            x: 420,
            y: 482,
          },
          type: 'xod/core/output-pulse',
        },
        BJHu2GV5al: {
          id: 'BJHu2GV5al',
          pins: {},
          position: {
            x: 242,
            y: 486,
          },
          type: 'xod/core/output-pulse',
        },
        H1PuhzVcax: {
          id: 'H1PuhzVcax',
          pins: {},
          position: {
            x: 332,
            y: 251,
          },
          type: 'xod/core/less',
        },
        r14dnfE9al: {
          id: 'r14dnfE9al',
          pins: {},
          position: {
            x: 332,
            y: 336,
          },
          type: 'xod/core/choose',
        },
        rk7unMVqpx: {
          id: 'rk7unMVqpx',
          pins: {},
          position: {
            x: 226,
            y: 91,
          },
          type: 'xod/core/input-number',
        },
        rk__hGVcpe: {
          id: 'rk__hGVcpe',
          pins: {},
          position: {
            x: 460,
            y: 88,
          },
          type: 'xod/core/input-number',
        },
      },
      path: 'xod/core/choose-range',
    },
    'xod/core/choose-range-2p': {
      impls: {},
      links: {
        H1alKhzEqpl: {
          id: 'H1alKhzEqpl',
          input: {
            nodeId: 'H1aOnfEcpe',
            pinKey: '__in__',
          },
          output: {
            nodeId: 'rJWlOnGNqal',
            pinKey: 'BJHu2GV5al',
          },
        },
        H1jeF2MNcTg: {
          id: 'H1jeF2MNcTg',
          input: {
            nodeId: 'r1FO2fN5ag',
            pinKey: '__in__',
          },
          output: {
            nodeId: 'BJiu3GNq6g',
            pinKey: 'B1Iu3fV9pe',
          },
        },
        H1xZYnGV56x: {
          id: 'H1xZYnGV56x',
          input: {
            nodeId: 'rygeO3zE5Te',
            pinKey: '__in__',
          },
          output: {
            nodeId: 'SJ2u2zVqTe',
            pinKey: 'out',
          },
        },
        Sy9xthME56g: {
          id: 'Sy9xthME56g',
          input: {
            nodeId: 'rJWlOnGNqal',
            pinKey: 'rk7unMVqpx',
          },
          output: {
            nodeId: 'ByCO2fNqag',
            pinKey: '__out__',
          },
        },
        r1JbF3ME5Tx: {
          id: 'r1JbF3ME5Tx',
          input: {
            nodeId: 'SJ2u2zVqTe',
            pinKey: 'a',
          },
          output: {
            nodeId: 'rJWlOnGNqal',
            pinKey: 'B1Iu3fV9pe',
          },
        },
        r1_xF2fE9Tx: {
          id: 'r1_xF2fE9Tx',
          input: {
            nodeId: 'BJiu3GNq6g',
            pinKey: 'rk__hGVcpe',
          },
          output: {
            nodeId: 'rk1guhzVqpl',
            pinKey: '__out__',
          },
        },
        rJ0gY2G49px: {
          id: 'rJ0gY2G49px',
          input: {
            nodeId: 'SJ2u2zVqTe',
            pinKey: 'b',
          },
          output: {
            nodeId: 'BJiu3GNq6g',
            pinKey: 'BJHu2GV5al',
          },
        },
        rkKetnfN5al: {
          id: 'rkKetnfN5al',
          input: {
            nodeId: 'BJiu3GNq6g',
            pinKey: 'rk7unMVqpx',
          },
          output: {
            nodeId: 'ByCO2fNqag',
            pinKey: '__out__',
          },
        },
        ry2xt2M4c6e: {
          id: 'ry2xt2M4c6e',
          input: {
            nodeId: 'rJWlOnGNqal',
            pinKey: 'rk__hGVcpe',
          },
          output: {
            nodeId: 'BJqu3zV9ax',
            pinKey: '__out__',
          },
        },
      },
      nodes: {
        BJiu3GNq6g: {
          id: 'BJiu3GNq6g',
          pins: {},
          position: {
            x: 462,
            y: 256,
          },
          type: 'xod/core/choose-range',
        },
        BJqu3zV9ax: {
          id: 'BJqu3zV9ax',
          pins: {},
          position: {
            x: 367,
            y: 117,
          },
          type: 'xod/core/input-number',
        },
        ByCO2fNqag: {
          id: 'ByCO2fNqag',
          pins: {},
          position: {
            x: 189,
            y: 116,
          },
          type: 'xod/core/input-number',
        },
        H1aOnfEcpe: {
          id: 'H1aOnfEcpe',
          pins: {},
          position: {
            x: 191,
            y: 452,
          },
          type: 'xod/core/output-pulse',
        },
        SJ2u2zVqTe: {
          id: 'SJ2u2zVqTe',
          pins: {},
          position: {
            x: 382,
            y: 361,
          },
          type: 'xod/core/both',
        },
        r1FO2fN5ag: {
          id: 'r1FO2fN5ag',
          pins: {},
          position: {
            x: 554,
            y: 457,
          },
          type: 'xod/core/output-pulse',
        },
        rJWlOnGNqal: {
          id: 'rJWlOnGNqal',
          pins: {},
          position: {
            x: 271,
            y: 258,
          },
          type: 'xod/core/choose-range',
        },
        rk1guhzVqpl: {
          id: 'rk1guhzVqpl',
          pins: {},
          position: {
            x: 553,
            y: 118,
          },
          type: 'xod/core/input-number',
        },
        rygeO3zE5Te: {
          id: 'rygeO3zE5Te',
          pins: {},
          position: {
            x: 402,
            y: 456,
          },
          type: 'xod/core/output-pulse',
        },
      },
      path: 'xod/core/choose-range-2p',
    },
    'xod/core/choose-range-3p': {
      impls: {},
      links: {
        'B1O-F2zN56g': {
          id: 'B1O-F2zN56g',
          input: {
            nodeId: 'HycgdhfNqpe',
            pinKey: '__in__',
          },
          output: {
            nodeId: 'Skog_nME5Tg',
            pinKey: 'B1Iu3fV9pe',
          },
        },
        BJXbt3fVcae: {
          id: 'BJXbt3fVcae',
          input: {
            nodeId: 'Hy8eu3MNqTl',
            pinKey: 'rk1guhzVqpl',
          },
          output: {
            nodeId: 'HkVeOnzV9ae',
            pinKey: '__out__',
          },
        },
        BkUbF2zE9ax: {
          id: 'BkUbF2zE9ax',
          input: {
            nodeId: 'Skog_nME5Tg',
            pinKey: 'rk__hGVcpe',
          },
          output: {
            nodeId: 'ByHe_hGEc6l',
            pinKey: '__out__',
          },
        },
        BkbZK2zN9pe: {
          id: 'BkbZK2zN9pe',
          input: {
            nodeId: 'Hy8eu3MNqTl',
            pinKey: 'ByCO2fNqag',
          },
          output: {
            nodeId: 'Skfg_nfE5pg',
            pinKey: '__out__',
          },
        },
        BkwZthfE9al: {
          id: 'BkwZthfE9al',
          input: {
            nodeId: 'Skog_nME5Tg',
            pinKey: 'rk7unMVqpx',
          },
          output: {
            nodeId: 'Skfg_nfE5pg',
            pinKey: '__out__',
          },
        },
        H1MWKhGNqTx: {
          id: 'H1MWKhGNqTx',
          input: {
            nodeId: 'Hy8eu3MNqTl',
            pinKey: 'BJqu3zV9ax',
          },
          output: {
            nodeId: 'BJXxO2zVqpx',
            pinKey: '__out__',
          },
        },
        HJBZKnMEqae: {
          id: 'HJBZKnMEqae',
          input: {
            nodeId: 'B1_x_3G4q6x',
            pinKey: '__in__',
          },
          output: {
            nodeId: 'Hy8eu3MNqTl',
            pinKey: 'rygeO3zE5Te',
          },
        },
        S1KZY2MN96l: {
          id: 'S1KZY2MN96l',
          input: {
            nodeId: 'S12ld3MNcax',
            pinKey: 'a',
          },
          output: {
            nodeId: 'Hy8eu3MNqTl',
            pinKey: 'r1FO2fN5ag',
          },
        },
        'Sy5-YnzEq6e': {
          id: 'Sy5-YnzEq6e',
          input: {
            nodeId: 'S12ld3MNcax',
            pinKey: 'b',
          },
          output: {
            nodeId: 'Skog_nME5Tg',
            pinKey: 'BJHu2GV5al',
          },
        },
        rkiWt3MV9Tx: {
          id: 'rkiWt3MV9Tx',
          input: {
            nodeId: 'BkFxdnzNcpg',
            pinKey: '__in__',
          },
          output: {
            nodeId: 'S12ld3MNcax',
            pinKey: 'out',
          },
        },
        ryNWFhGEqag: {
          id: 'ryNWFhGEqag',
          input: {
            nodeId: 'Hkwedhz456l',
            pinKey: '__in__',
          },
          output: {
            nodeId: 'Hy8eu3MNqTl',
            pinKey: 'H1aOnfEcpe',
          },
        },
      },
      nodes: {
        B1_x_3G4q6x: {
          id: 'B1_x_3G4q6x',
          pins: {},
          position: {
            x: 313,
            y: 538,
          },
          type: 'xod/core/output-pulse',
        },
        BJXxO2zVqpx: {
          id: 'BJXxO2zVqpx',
          pins: {},
          position: {
            x: 315,
            y: 140,
          },
          type: 'xod/core/input-number',
        },
        BkFxdnzNcpg: {
          id: 'BkFxdnzNcpg',
          pins: {},
          position: {
            x: 456,
            y: 535,
          },
          type: 'xod/core/output-pulse',
        },
        ByHe_hGEc6l: {
          id: 'ByHe_hGEc6l',
          pins: {},
          position: {
            x: 589,
            y: 140,
          },
          type: 'xod/core/input-number',
        },
        HkVeOnzV9ae: {
          id: 'HkVeOnzV9ae',
          pins: {},
          position: {
            x: 452,
            y: 140,
          },
          type: 'xod/core/input-number',
        },
        Hkwedhz456l: {
          id: 'Hkwedhz456l',
          pins: {},
          position: {
            x: 171,
            y: 538,
          },
          type: 'xod/core/output-pulse',
        },
        Hy8eu3MNqTl: {
          id: 'Hy8eu3MNqTl',
          pins: {},
          position: {
            x: 249,
            y: 294,
          },
          type: 'xod/core/choose-range-2p',
        },
        HycgdhfNqpe: {
          id: 'HycgdhfNqpe',
          pins: {},
          position: {
            x: 598,
            y: 533,
          },
          type: 'xod/core/output-pulse',
        },
        S12ld3MNcax: {
          id: 'S12ld3MNcax',
          pins: {},
          position: {
            x: 419,
            y: 405,
          },
          type: 'xod/core/both',
        },
        Skfg_nfE5pg: {
          id: 'Skfg_nfE5pg',
          pins: {},
          position: {
            x: 173,
            y: 140,
          },
          type: 'xod/core/input-number',
        },
        Skog_nME5Tg: {
          id: 'Skog_nME5Tg',
          pins: {},
          position: {
            x: 495,
            y: 297,
          },
          type: 'xod/core/choose-range',
        },
      },
      path: 'xod/core/choose-range-3p',
    },
    'xod/core/clock': {
      impls: {
        cpp: 'struct State {\n    TimeMs nextTrig;\n};\n\n{{ GENERATED_CODE }}\n\nvoid evaluate(NodeId nid, State* state) {\n    TimeMs tNow = transactionTime();\n    TimeMs dt = getNumber(nid, Inputs::IVAL) * 1000;\n    TimeMs tNext = tNow + dt;\n\n    if (isInputDirty(nid, Inputs::IVAL)) {\n        if (dt == 0) {\n            state->nextTrig = 0;\n            clearTimeout(nid);\n        } else if (state->nextTrig < tNow || state->nextTrig > tNext) {\n            state->nextTrig = tNext;\n            setTimeout(nid, dt);\n        }\n    } else {\n        // It was a scheduled tick\n        emitLogic(nid, Outputs::TICK, 1);\n        state->nextTrig = tNext;\n        setTimeout(nid, dt);\n    }\n}\n',
        js: '\nmodule.exports.evaluate = function(e) {\n  if (e.context.intervalID) {\n    clearInterval(e.context.intervalID);\n  }\n\n  e.context.intervalID = setInterval(function() {\n    e.fire({ tick: PULSE });\n  }, e.inputs.interval * 1000);\n};\n',
      },
      links: {},
      nodes: {
        noNativeImpl: {
          description: '',
          id: 'noNativeImpl',
          label: '',
          position: {
            x: 100,
            y: 100,
          },
          type: 'xod/patch-nodes/not-implemented-in-xod',
        },
        interval: {
          id: 'interval',
          type: 'xod/patch-nodes/input-number',
          position: {
            x: 0,
            y: 0,
          },
          label: '',
          description: '',
        },
        tick: {
          id: 'tick',
          type: 'xod/patch-nodes/output-pulse',
          position: {
            x: 0,
            y: 300,
          },
          label: '',
          description: '',
        },
      },
      path: 'xod/core/clock',
    },
    'xod/core/compare': {
      impls: {
        js: '\nmodule.exports.evaluate = function(e) {\n  var a = e.inputs.a;\n  var b = e.inputs.b;\n  if (a < b) {\n    return { less: PULSE };\n  } else if (a > b) {\n    return { greater: PULSE };\n  } else {\n    return { equal: PULSE };\n  }\n};\n',
      },
      links: {},
      nodes: {
        noNativeImpl: {
          description: '',
          id: 'noNativeImpl',
          label: '',
          position: {
            x: 100,
            y: 100,
          },
          type: 'xod/patch-nodes/not-implemented-in-xod',
        },
        a: {
          id: 'a',
          type: 'xod/patch-nodes/input-number',
          position: {
            x: 0,
            y: 0,
          },
          label: '',
          description: '',
        },
        b: {
          id: 'b',
          type: 'xod/patch-nodes/input-number',
          position: {
            x: 200,
            y: 0,
          },
          label: '',
          description: '',
        },
        equal: {
          id: 'equal',
          type: 'xod/patch-nodes/output-pulse',
          position: {
            x: 0,
            y: 300,
          },
          label: '',
          description: '',
        },
        greater: {
          id: 'greater',
          type: 'xod/patch-nodes/output-pulse',
          position: {
            x: 400,
            y: 300,
          },
          label: '',
          description: '',
        },
        less: {
          id: 'less',
          type: 'xod/patch-nodes/output-pulse',
          position: {
            x: 200,
            y: 300,
          },
          label: '',
          description: '',
        },
      },
      path: 'xod/core/compare',
    },
    'xod/core/concat': {
      impls: {
        js: 'module.exports.evaluate = function(e) {\n  return { result: (String(e.inputs.a) + String(e.inputs.b)) };\n};\n',
      },
      links: {},
      nodes: {
        noNativeImpl: {
          description: '',
          id: 'noNativeImpl',
          label: '',
          position: {
            x: 100,
            y: 100,
          },
          type: 'xod/patch-nodes/not-implemented-in-xod',
        },
        a: {
          id: 'a',
          type: 'xod/patch-nodes/input-string',
          position: {
            x: 0,
            y: 0,
          },
          label: '',
          description: '',
        },
        b: {
          id: 'b',
          type: 'xod/patch-nodes/input-string',
          position: {
            x: 200,
            y: 0,
          },
          label: '',
          description: '',
        },
        result: {
          id: 'result',
          type: 'xod/patch-nodes/output-string',
          position: {
            x: 0,
            y: 300,
          },
          label: '',
          description: '',
        },
      },
      path: 'xod/core/concat',
    },
    'xod/core/const-bool': {
      impls: {
        js: '\nmodule.exports.evaluate = function(e) {\n  return { value: e.inputs.inValue };\n};\n',
      },
      links: {},
      nodes: {
        noNativeImpl: {
          description: '',
          id: 'noNativeImpl',
          label: '',
          position: {
            x: 100,
            y: 100,
          },
          type: 'xod/patch-nodes/not-implemented-in-xod',
        },
        inValue: {
          id: 'inValue',
          type: 'xod/patch-nodes/input-boolean',
          position: {
            x: 0,
            y: 0,
          },
          label: '',
          description: '',
        },
        pulse: {
          id: 'pulse',
          type: 'xod/patch-nodes/input-pulse',
          position: {
            x: 200,
            y: 0,
          },
          label: '',
          description: '',
        },
        value: {
          id: 'value',
          type: 'xod/patch-nodes/output-boolean',
          position: {
            x: 0,
            y: 300,
          },
          label: '',
          description: '',
        },
      },
      path: 'xod/core/const-bool',
    },
    'xod/core/const-number': {
      impls: {
        js: '\nmodule.exports.evaluate = function(e) {\n  return { value: e.inputs.inValue };\n};\n',
      },
      links: {},
      nodes: {
        noNativeImpl: {
          description: '',
          id: 'noNativeImpl',
          label: '',
          position: {
            x: 100,
            y: 100,
          },
          type: 'xod/patch-nodes/not-implemented-in-xod',
        },
        inValue: {
          id: 'inValue',
          type: 'xod/patch-nodes/input-number',
          position: {
            x: 0,
            y: 0,
          },
          label: '',
          description: '',
        },
        pulse: {
          id: 'pulse',
          type: 'xod/patch-nodes/input-pulse',
          position: {
            x: 200,
            y: 0,
          },
          label: '',
          description: '',
        },
        value: {
          id: 'value',
          type: 'xod/patch-nodes/output-number',
          position: {
            x: 0,
            y: 300,
          },
          label: '',
          description: '',
        },
      },
      path: 'xod/core/const-number',
    },
    'xod/core/const-string': {
      impls: {
        js: '\nmodule.exports.evaluate = function(e) {\n  return { value: e.inputs.inValue };\n};\n',
      },
      links: {},
      nodes: {
        noNativeImpl: {
          description: '',
          id: 'noNativeImpl',
          label: '',
          position: {
            x: 100,
            y: 100,
          },
          type: 'xod/patch-nodes/not-implemented-in-xod',
        },
        inValue: {
          id: 'inValue',
          type: 'xod/patch-nodes/input-string',
          position: {
            x: 0,
            y: 0,
          },
          label: '',
          description: '',
        },
        pulse: {
          id: 'pulse',
          type: 'xod/patch-nodes/input-pulse',
          position: {
            x: 200,
            y: 0,
          },
          label: '',
          description: '',
        },
        value: {
          id: 'value',
          type: 'xod/patch-nodes/output-string',
          position: {
            x: 0,
            y: 300,
          },
          label: '',
          description: '',
        },
      },
      path: 'xod/core/const-string',
    },
    'xod/core/constant-logic': {
      impls: {
        cpp: 'struct State {\n};\n\n{{ GENERATED_CODE }}\n\nvoid evaluate(NodeId nid, State* state) {\n    reemitLogic(nid, Outputs::VAL);\n}\n',
      },
      links: {},
      nodes: {
        noNativeImpl: {
          description: '',
          id: 'noNativeImpl',
          label: '',
          position: {
            x: 100,
            y: 100,
          },
          type: 'xod/patch-nodes/not-implemented-in-xod',
        },
        VAL: {
          id: 'VAL',
          type: 'xod/patch-nodes/output-boolean',
          position: {
            x: 0,
            y: 300,
          },
          label: '',
          description: '',
        },
      },
      path: 'xod/core/constant-logic',
    },
    'xod/core/constant-number': {
      impls: {
        cpp: 'struct State {\n};\n\n{{ GENERATED_CODE }}\n\nvoid evaluate(NodeId nid, State* state) {\n    reemitNumber(nid, Outputs::VAL);\n}\n',
      },
      links: {},
      nodes: {
        noNativeImpl: {
          description: '',
          id: 'noNativeImpl',
          label: '',
          position: {
            x: 100,
            y: 100,
          },
          type: 'xod/patch-nodes/not-implemented-in-xod',
        },
        VAL: {
          id: 'VAL',
          type: 'xod/patch-nodes/output-number',
          position: {
            x: 0,
            y: 300,
          },
          label: '',
          description: '',
        },
      },
      path: 'xod/core/constant-number',
    },
    'xod/core/digital-input': {
      impls: {
        espruino: "\nmodule.exports.setup = function(e) {\n  e.inputs.pin = new Pin(e.inputs.pin);\n\n  setWatch(function(evt) {\n    e.fire({ state: !evt.state });\n  }, e.inputs.pin, {\n    edge: 'both',\n    repeat: true,\n    debounce: 30\n  });\n};\n",
      },
      links: {},
      nodes: {
        noNativeImpl: {
          description: '',
          id: 'noNativeImpl',
          label: '',
          position: {
            x: 100,
            y: 100,
          },
          type: 'xod/patch-nodes/not-implemented-in-xod',
        },
        PIN: {
          id: 'PIN',
          type: 'xod/patch-nodes/input-string',
          position: {
            x: 0,
            y: 0,
          },
          label: '',
          description: '',
        },
        VALUE: {
          id: 'VALUE',
          type: 'xod/patch-nodes/output-number',
          position: {
            x: 0,
            y: 300,
          },
          label: '',
          description: '',
        },
      },
      path: 'xod/core/digital-input',
    },
    'xod/core/digital-output': {
      impls: {
        arduino: 'struct State {\n};\n\n{{ GENERATED_CODE }}\n\nvoid evaluate(NodeId nid, State* state) {\n    const int pin = (int)getNumber(nid, Inputs::PIN);\n    const bool val = getLogic(nid, Inputs::VALUE);\n\n    if (isInputDirty(nid, Inputs::PIN)) {\n        ::pinMode(pin, OUTPUT);\n    }\n\n    ::digitalWrite(pin, val);\n}\n',
        espruino: '\nmodule.exports.evaluate = function(e) {\n  digitalWrite(e.inputs.pin, e.inputs.value);\n};\n',
      },
      links: {},
      nodes: {
        noNativeImpl: {
          description: '',
          id: 'noNativeImpl',
          label: '',
          position: {
            x: 100,
            y: 100,
          },
          type: 'xod/patch-nodes/not-implemented-in-xod',
        },
        PIN: {
          id: 'PIN',
          type: 'xod/patch-nodes/input-number',
          position: {
            x: 0,
            y: 0,
          },
          label: '',
          description: '',
        },
        VALUE: {
          id: 'VALUE',
          type: 'xod/patch-nodes/input-boolean',
          position: {
            x: 200,
            y: 0,
          },
          label: '',
          description: '',
        },
      },
      path: 'xod/core/digital-output',
    },
    'xod/core/either': {
      impls: {
        js: '\nmodule.exports.evaluate = function(e) {\n  var out = e.inputs.inp ? e.inputs.trueValue : e.inputs.falseValue;\n  return { out: out };\n};\n',
      },
      links: {},
      nodes: {
        noNativeImpl: {
          description: '',
          id: 'noNativeImpl',
          label: '',
          position: {
            x: 100,
            y: 100,
          },
          type: 'xod/patch-nodes/not-implemented-in-xod',
        },
        falseValue: {
          id: 'falseValue',
          type: 'xod/patch-nodes/input-number',
          position: {
            x: 400,
            y: 0,
          },
          label: '',
          description: '',
        },
        inp: {
          id: 'inp',
          type: 'xod/patch-nodes/input-boolean',
          position: {
            x: 0,
            y: 0,
          },
          label: '',
          description: '',
        },
        out: {
          id: 'out',
          type: 'xod/patch-nodes/output-number',
          position: {
            x: 0,
            y: 300,
          },
          label: '',
          description: '',
        },
        trueValue: {
          id: 'trueValue',
          type: 'xod/patch-nodes/input-number',
          position: {
            x: 200,
            y: 0,
          },
          label: '',
          description: '',
        },
      },
      path: 'xod/core/either',
    },
    'xod/core/equal': {
      impls: {
        js: '\nmodule.exports.evaluate = function(e) {\n  var a = e.inputs.a;\n  var b = e.inputs.b;\n\n  if (a === undefined || b === undefined) {\n    return;\n  }\n\n  return { out: a === b };\n};\n',
      },
      links: {},
      nodes: {
        noNativeImpl: {
          description: '',
          id: 'noNativeImpl',
          label: '',
          position: {
            x: 100,
            y: 100,
          },
          type: 'xod/patch-nodes/not-implemented-in-xod',
        },
        a: {
          id: 'a',
          type: 'xod/patch-nodes/input-number',
          position: {
            x: 0,
            y: 0,
          },
          label: '',
          description: '',
        },
        b: {
          id: 'b',
          type: 'xod/patch-nodes/input-number',
          position: {
            x: 200,
            y: 0,
          },
          label: '',
          description: '',
        },
        out: {
          id: 'out',
          type: 'xod/patch-nodes/output-boolean',
          position: {
            x: 0,
            y: 300,
          },
          label: '',
          description: '',
        },
      },
      path: 'xod/core/equal',
    },
    'xod/core/file-read': {
      impls: {
        nodejs: "var path = require('path');\nvar fs = require('fs');\n\nmodule.exports.evaluate = function(e) {\n  var filename = e.inputs.fileName;\n\n  fs.readFile(filename, function (err, data) {\n    if (err) {\n      e.fire({ error: err.toString() });\n      return;\n    }\n\n    e.fire({ data: data });\n  });\n};\n",
      },
      links: {},
      nodes: {
        noNativeImpl: {
          description: '',
          id: 'noNativeImpl',
          label: '',
          position: {
            x: 100,
            y: 100,
          },
          type: 'xod/patch-nodes/not-implemented-in-xod',
        },
        data: {
          id: 'data',
          type: 'xod/patch-nodes/output-string',
          position: {
            x: 0,
            y: 300,
          },
          label: '',
          description: '',
        },
        error: {
          id: 'error',
          type: 'xod/patch-nodes/output-string',
          position: {
            x: 200,
            y: 300,
          },
          label: '',
          description: '',
        },
        fileName: {
          id: 'fileName',
          type: 'xod/patch-nodes/input-string',
          position: {
            x: 0,
            y: 0,
          },
          label: '',
          description: '',
        },
        pulse: {
          id: 'pulse',
          type: 'xod/patch-nodes/input-pulse',
          position: {
            x: 200,
            y: 0,
          },
          label: '',
          description: '',
        },
      },
      path: 'xod/core/file-read',
    },
    'xod/core/file-write': {
      impls: {
        nodejs: "var path = require('path');\nvar fs = require('fs');\n\nmodule.exports.evaluate = function(e) {\n  var filename = e.inputs.fileName;\n  var data = e.inputs.data;\n\n  fs.writeFile(filename, data, function (err) {\n    if (err) {\n      e.fire({ onFailure: err.toString() });\n      return;\n    }\n\n    e.fire({ onSuccess: PULSE });\n  });\n};\n",
      },
      links: {},
      nodes: {
        noNativeImpl: {
          description: '',
          id: 'noNativeImpl',
          label: '',
          position: {
            x: 100,
            y: 100,
          },
          type: 'xod/patch-nodes/not-implemented-in-xod',
        },
        data: {
          id: 'data',
          type: 'xod/patch-nodes/input-pulse',
          position: {
            x: 200,
            y: 0,
          },
          label: '',
          description: '',
        },
        fileName: {
          id: 'fileName',
          type: 'xod/patch-nodes/input-string',
          position: {
            x: 0,
            y: 0,
          },
          label: '',
          description: '',
        },
        onFailure: {
          id: 'onFailure',
          type: 'xod/patch-nodes/output-string',
          position: {
            x: 200,
            y: 300,
          },
          label: '',
          description: '',
        },
        onSuccess: {
          id: 'onSuccess',
          type: 'xod/patch-nodes/output-pulse',
          position: {
            x: 0,
            y: 300,
          },
          label: '',
          description: '',
        },
      },
      path: 'xod/core/file-write',
    },
    'xod/core/greater': {
      impls: {
        js: '\nmodule.exports.evaluate = function(e) {\n  var a = e.inputs.a;\n  var b = e.inputs.b;\n\n  if (a === undefined || b === undefined) {\n    return;\n  }\n\n  return { out: a > b };\n};\n',
      },
      links: {},
      nodes: {
        noNativeImpl: {
          description: '',
          id: 'noNativeImpl',
          label: '',
          position: {
            x: 100,
            y: 100,
          },
          type: 'xod/patch-nodes/not-implemented-in-xod',
        },
        a: {
          id: 'a',
          type: 'xod/patch-nodes/input-number',
          position: {
            x: 0,
            y: 0,
          },
          label: '',
          description: '',
        },
        b: {
          id: 'b',
          type: 'xod/patch-nodes/input-number',
          position: {
            x: 200,
            y: 0,
          },
          label: '',
          description: '',
        },
        out: {
          id: 'out',
          type: 'xod/patch-nodes/output-boolean',
          position: {
            x: 0,
            y: 300,
          },
          label: '',
          description: '',
        },
      },
      path: 'xod/core/greater',
    },
    'xod/core/greater-equal': {
      impls: {},
      links: {
        BykfK2G49Tx: {
          id: 'BykfK2G49Tx',
          input: {
            nodeId: 'SJb-u2f4qal',
            pinKey: '__in__',
          },
          output: {
            nodeId: 'B1lWO3G4qag',
            pinKey: 'out',
          },
        },
        HJ6bYhfEcTl: {
          id: 'HJ6bYhfEcTl',
          input: {
            nodeId: 'H1k-d3zN9ae',
            pinKey: 'b',
          },
          output: {
            nodeId: 'r10lu2MVq6g',
            pinKey: '__out__',
          },
        },
        HJRWt3MV56l: {
          id: 'HJRWt3MV56l',
          input: {
            nodeId: 'B1lWO3G4qag',
            pinKey: 'in',
          },
          output: {
            nodeId: 'H1k-d3zN9ae',
            pinKey: 'out',
          },
        },
        SynbFhfE9px: {
          id: 'SynbFhfE9px',
          input: {
            nodeId: 'H1k-d3zN9ae',
            pinKey: 'a',
          },
          output: {
            nodeId: 'HJ6gO2fVcpx',
            pinKey: '__out__',
          },
        },
      },
      nodes: {
        B1lWO3G4qag: {
          id: 'B1lWO3G4qag',
          pins: {},
          position: {
            x: 360,
            y: 358,
          },
          type: 'xod/core/not',
        },
        'H1k-d3zN9ae': {
          id: 'H1k-d3zN9ae',
          pins: {},
          position: {
            x: 353,
            y: 249,
          },
          type: 'xod/core/less',
        },
        HJ6gO2fVcpx: {
          id: 'HJ6gO2fVcpx',
          pins: {},
          position: {
            x: 271,
            y: 122,
          },
          type: 'xod/core/input-number',
        },
        'SJb-u2f4qal': {
          id: 'SJb-u2f4qal',
          pins: {},
          position: {
            x: 360,
            y: 479,
          },
          type: 'xod/core/output-boolean',
        },
        r10lu2MVq6g: {
          id: 'r10lu2MVq6g',
          pins: {},
          position: {
            x: 439,
            y: 120,
          },
          type: 'xod/core/input-number',
        },
      },
      path: 'xod/core/greater-equal',
    },
    'xod/core/in-range': {
      impls: {},
      links: {
        BJgMYhMEqpx: {
          id: 'BJgMYhMEqpx',
          input: {
            nodeId: 'HJrb_nz4qTx',
            pinKey: 'HJ6gO2fVcpx',
          },
          output: {
            nodeId: 'BJGbOnfE5pl',
            pinKey: '__out__',
          },
        },
        BkrMYhzV9ax: {
          id: 'BkrMYhzV9ax',
          input: {
            nodeId: 'HywZO2zE9ag',
            pinKey: 'b',
          },
          output: {
            nodeId: 'HJIZ_2f4qag',
            pinKey: 'out',
          },
        },
        SJWMK3fN5pg: {
          id: 'SJWMK3fN5pg',
          input: {
            nodeId: 'HJrb_nz4qTx',
            pinKey: 'r10lu2MVq6g',
          },
          output: {
            nodeId: 'SymbO3GNcal',
            pinKey: '__out__',
          },
        },
        rJNGK3f49ax: {
          id: 'rJNGK3f49ax',
          input: {
            nodeId: 'HywZO2zE9ag',
            pinKey: 'a',
          },
          output: {
            nodeId: 'HJrb_nz4qTx',
            pinKey: 'SJb-u2f4qal',
          },
        },
        rJmMF3GEqae: {
          id: 'rJmMF3GEqae',
          input: {
            nodeId: 'HJIZ_2f4qag',
            pinKey: 'b',
          },
          output: {
            nodeId: 'HJVZ_2GEcpe',
            pinKey: '__out__',
          },
        },
        rkzfY2GE9al: {
          id: 'rkzfY2GE9al',
          input: {
            nodeId: 'HJIZ_2f4qag',
            pinKey: 'a',
          },
          output: {
            nodeId: 'BJGbOnfE5pl',
            pinKey: '__out__',
          },
        },
        ry8zYhMN5px: {
          id: 'ry8zYhMN5px',
          input: {
            nodeId: 'Hy_bd3MNcax',
            pinKey: '__in__',
          },
          output: {
            nodeId: 'HywZO2zE9ag',
            pinKey: 'out',
          },
        },
      },
      nodes: {
        BJGbOnfE5pl: {
          id: 'BJGbOnfE5pl',
          pins: {},
          position: {
            x: 241,
            y: 117,
          },
          type: 'xod/core/input-number',
        },
        HJIZ_2f4qag: {
          id: 'HJIZ_2f4qag',
          pins: {},
          position: {
            x: 520,
            y: 271,
          },
          type: 'xod/core/less',
        },
        HJVZ_2GEcpe: {
          id: 'HJVZ_2GEcpe',
          pins: {},
          position: {
            x: 595,
            y: 116,
          },
          type: 'xod/core/input-number',
        },
        HJrb_nz4qTx: {
          id: 'HJrb_nz4qTx',
          pins: {},
          position: {
            x: 349,
            y: 270,
          },
          type: 'xod/core/greater-equal',
        },
        Hy_bd3MNcax: {
          id: 'Hy_bd3MNcax',
          pins: {},
          position: {
            x: 432,
            y: 541,
          },
          type: 'xod/core/output-boolean',
        },
        HywZO2zE9ag: {
          id: 'HywZO2zE9ag',
          pins: {},
          position: {
            x: 432,
            y: 407,
          },
          type: 'xod/core/and',
        },
        SymbO3GNcal: {
          id: 'SymbO3GNcal',
          pins: {},
          position: {
            x: 434,
            y: 114,
          },
          type: 'xod/core/input-number',
        },
      },
      path: 'xod/core/in-range',
    },
    'xod/core/input-bool': {
      impls: {},
      links: {},
      nodes: {
        noNativeImpl: {
          description: '',
          id: 'noNativeImpl',
          label: '',
          position: {
            x: 100,
            y: 100,
          },
          type: 'xod/patch-nodes/not-implemented-in-xod',
        },
        __out__: {
          id: '__out__',
          type: 'xod/patch-nodes/output-boolean',
          position: {
            x: 0,
            y: 300,
          },
          label: '',
          description: '',
        },
      },
      path: 'xod/core/input-bool',
    },
    'xod/core/input-boolean': {
      impls: {},
      links: {},
      nodes: {
        noNativeImpl: {
          description: '',
          id: 'noNativeImpl',
          label: '',
          position: {
            x: 100,
            y: 100,
          },
          type: 'xod/patch-nodes/not-implemented-in-xod',
        },
        __out__: {
          id: '__out__',
          type: 'xod/patch-nodes/output-boolean',
          position: {
            x: 0,
            y: 300,
          },
          label: '',
          description: '',
        },
      },
      path: 'xod/core/input-boolean',
    },
    'xod/core/input-number': {
      impls: {},
      links: {},
      nodes: {
        noNativeImpl: {
          description: '',
          id: 'noNativeImpl',
          label: '',
          position: {
            x: 100,
            y: 100,
          },
          type: 'xod/patch-nodes/not-implemented-in-xod',
        },
        __out__: {
          id: '__out__',
          type: 'xod/patch-nodes/output-number',
          position: {
            x: 0,
            y: 300,
          },
          label: '',
          description: '',
        },
      },
      path: 'xod/core/input-number',
    },
    'xod/core/input-pulse': {
      impls: {},
      links: {},
      nodes: {
        noNativeImpl: {
          description: '',
          id: 'noNativeImpl',
          label: '',
          position: {
            x: 100,
            y: 100,
          },
          type: 'xod/patch-nodes/not-implemented-in-xod',
        },
        __out__: {
          id: '__out__',
          type: 'xod/patch-nodes/output-pulse',
          position: {
            x: 0,
            y: 300,
          },
          label: '',
          description: '',
        },
      },
      path: 'xod/core/input-pulse',
    },
    'xod/core/input-string': {
      impls: {},
      links: {},
      nodes: {
        noNativeImpl: {
          description: '',
          id: 'noNativeImpl',
          label: '',
          position: {
            x: 100,
            y: 100,
          },
          type: 'xod/patch-nodes/not-implemented-in-xod',
        },
        __out__: {
          id: '__out__',
          type: 'xod/patch-nodes/output-string',
          position: {
            x: 0,
            y: 300,
          },
          label: '',
          description: '',
        },
      },
      path: 'xod/core/input-string',
    },
    'xod/core/latch': {
      impls: {
        cpp: 'struct State {\n    bool value;\n};\n\n{{ GENERATED_CODE }}\n\nvoid evaluate(NodeId nid, State* state) {\n    if (isInputDirty(nid, Inputs::RST)) {\n        state->value = false;\n    } else if (isInputDirty(nid, Inputs::SET)) {\n        state->value = true;\n    } else {\n        state->value = !state->value;\n    }\n\n    emitLogic(nid, Outputs::OUT, state->value);\n}\n',
        js: '\nmodule.exports.evaluate = function(e) {\n  var inputs = e.inputs;\n  var newState;\n\n  if (inputs.toggle) {\n    newState = !e.context.state;\n  } else if (inputs.set) {\n    newState = true;\n  } else /* if (inputs.reset) */ {\n    newState = false;\n  }\n\n  e.context.state = newState;\n  return { state: newState };\n};\n',
      },
      links: {},
      nodes: {
        noNativeImpl: {
          description: '',
          id: 'noNativeImpl',
          label: '',
          position: {
            x: 100,
            y: 100,
          },
          type: 'xod/patch-nodes/not-implemented-in-xod',
        },
        reset: {
          id: 'reset',
          type: 'xod/patch-nodes/input-pulse',
          position: {
            x: 400,
            y: 0,
          },
          label: '',
          description: '',
        },
        set: {
          id: 'set',
          type: 'xod/patch-nodes/input-pulse',
          position: {
            x: 200,
            y: 0,
          },
          label: '',
          description: '',
        },
        state: {
          id: 'state',
          type: 'xod/patch-nodes/output-boolean',
          position: {
            x: 0,
            y: 300,
          },
          label: '',
          description: '',
        },
        toggle: {
          id: 'toggle',
          type: 'xod/patch-nodes/input-pulse',
          position: {
            x: 0,
            y: 0,
          },
          label: '',
          description: '',
        },
      },
      path: 'xod/core/latch',
    },
    'xod/core/led': {
      impls: {
        espruino: '\nmodule.exports.setup = function(e) {\n  e.context.pin = new Pin(e.props.pin);\n};\n\nmodule.exports.evaluate = function(e) {\n  var b = e.inputs.brightness;\n\n  // Adjust duty cycle as a power function to align brightness\n  // perception by human eye\n  var duty = b * b * b;\n\n  analogWrite(e.context.pin, duty);\n};\n',
      },
      links: {},
      nodes: {
        noNativeImpl: {
          description: '',
          id: 'noNativeImpl',
          label: '',
          position: {
            x: 100,
            y: 100,
          },
          type: 'xod/patch-nodes/not-implemented-in-xod',
        },
        brightness: {
          id: 'brightness',
          type: 'xod/patch-nodes/input-number',
          position: {
            x: 0,
            y: 0,
          },
          label: '',
          description: '',
        },
      },
      path: 'xod/core/led',
    },
    'xod/core/led-new': {
      impls: {},
      links: {
        B1izYnz49Te: {
          id: 'B1izYnz49Te',
          input: {
            nodeId: 'rymFnzNcTe',
            pinKey: 'pin',
          },
          output: {
            nodeId: 'HJfKnfVcpe',
            pinKey: '__out__',
          },
        },
        BJqMF3ME5pe: {
          id: 'BJqMF3ME5pe',
          input: {
            nodeId: 'rymFnzNcTe',
            pinKey: 'value',
          },
          output: {
            nodeId: 'HylFhM45pg',
            pinKey: 'out',
          },
        },
        HkuzYhfE5Tg: {
          id: 'HkuzYhfE5Tg',
          input: {
            nodeId: 'HylFhM45pg',
            pinKey: 'b',
          },
          output: {
            nodeId: 'HJWF2fNq6l',
            pinKey: '__out__',
          },
        },
        SJtMY3ME9Tx: {
          id: 'SJtMY3ME9Tx',
          input: {
            nodeId: 'HylFhM45pg',
            pinKey: 'a',
          },
          output: {
            nodeId: 'SJKhfEqTl',
            pinKey: 'out',
          },
        },
        r13MK3M4cal: {
          id: 'r13MK3M4cal',
          input: {
            nodeId: 'SJKhfEqTl',
            pinKey: 'b',
          },
          output: {
            nodeId: 'HJWF2fNq6l',
            pinKey: '__out__',
          },
        },
        rkvMF3zEq6g: {
          id: 'rkvMF3zEq6g',
          input: {
            nodeId: 'SJKhfEqTl',
            pinKey: 'a',
          },
          output: {
            nodeId: 'HJWF2fNq6l',
            pinKey: '__out__',
          },
        },
      },
      nodes: {
        HJWF2fNq6l: {
          id: 'HJWF2fNq6l',
          pins: {},
          position: {
            x: 418,
            y: 104,
          },
          type: 'xod/core/input-number',
        },
        HJfKnfVcpe: {
          id: 'HJfKnfVcpe',
          pins: {},
          position: {
            x: 172,
            y: 104,
          },
          type: 'xod/core/input-number',
        },
        HylFhM45pg: {
          id: 'HylFhM45pg',
          pins: {},
          position: {
            x: 453,
            y: 298,
          },
          type: 'xod/math/multiply',
        },
        SJKhfEqTl: {
          id: 'SJKhfEqTl',
          pins: {},
          position: {
            x: 354,
            y: 218,
          },
          type: 'xod/math/multiply',
        },
        rymFnzNcTe: {
          id: 'rymFnzNcTe',
          pins: {
            pin: {
              curried: false,
            },
          },
          position: {
            x: 305,
            y: 430,
          },
          type: 'xod/core/digital-output',
        },
      },
      path: 'xod/core/led-new',
    },
    'xod/core/less': {
      impls: {
        js: '\nmodule.exports.evaluate = function(e) {\n  var a = e.inputs.a;\n  var b = e.inputs.b;\n\n  if (a === undefined || b === undefined) {\n    return;\n  }\n\n  return { out: a < b };\n};\n',
      },
      links: {},
      nodes: {
        noNativeImpl: {
          description: '',
          id: 'noNativeImpl',
          label: '',
          position: {
            x: 100,
            y: 100,
          },
          type: 'xod/patch-nodes/not-implemented-in-xod',
        },
        a: {
          id: 'a',
          type: 'xod/patch-nodes/input-number',
          position: {
            x: 0,
            y: 0,
          },
          label: '',
          description: '',
        },
        b: {
          id: 'b',
          type: 'xod/patch-nodes/input-number',
          position: {
            x: 200,
            y: 0,
          },
          label: '',
          description: '',
        },
        out: {
          id: 'out',
          type: 'xod/patch-nodes/output-boolean',
          position: {
            x: 0,
            y: 300,
          },
          label: '',
          description: '',
        },
      },
      path: 'xod/core/less',
    },
    'xod/core/less-equal': {
      impls: {},
      links: {
        B1lQKhzN5al: {
          id: 'B1lQKhzN5al',
          input: {
            nodeId: 'HkUt2MV5pg',
            pinKey: '__in__',
          },
          output: {
            nodeId: 'SJuYhM49pg',
            pinKey: 'out',
          },
        },
        Bk6MKhMNqpl: {
          id: 'Bk6MKhMNqpl',
          input: {
            nodeId: 'rkDFhMV5Te',
            pinKey: 'a',
          },
          output: {
            nodeId: 'BJNtnM45al',
            pinKey: '__out__',
          },
        },
        By1QF3fNc6l: {
          id: 'By1QF3fNc6l',
          input: {
            nodeId: 'SJuYhM49pg',
            pinKey: 'in',
          },
          output: {
            nodeId: 'rkDFhMV5Te',
            pinKey: 'out',
          },
        },
        rkRzthMN5Tg: {
          id: 'rkRzthMN5Tg',
          input: {
            nodeId: 'rkDFhMV5Te',
            pinKey: 'b',
          },
          output: {
            nodeId: 'ByrK2zNq6e',
            pinKey: '__out__',
          },
        },
      },
      nodes: {
        BJNtnM45al: {
          id: 'BJNtnM45al',
          pins: {},
          position: {
            x: 232,
            y: 76,
          },
          type: 'xod/core/input-number',
        },
        ByrK2zNq6e: {
          id: 'ByrK2zNq6e',
          pins: {},
          position: {
            x: 428,
            y: 78,
          },
          type: 'xod/core/input-number',
        },
        HkUt2MV5pg: {
          id: 'HkUt2MV5pg',
          pins: {},
          position: {
            x: 320,
            y: 454,
          },
          type: 'xod/core/output-boolean',
        },
        SJuYhM49pg: {
          id: 'SJuYhM49pg',
          pins: {},
          position: {
            x: 324,
            y: 318,
          },
          type: 'xod/core/not',
        },
        rkDFhMV5Te: {
          id: 'rkDFhMV5Te',
          pins: {},
          position: {
            x: 326,
            y: 196,
          },
          type: 'xod/core/greater',
        },
      },
      path: 'xod/core/less-equal',
    },
    'xod/core/map': {
      impls: {
        js: '\nmodule.exports.evaluate = function(e) {\n  var inputs = e.inputs;\n  var k = (inputs.inp - inputs.inA) / (inputs.inB - inputs.inA);\n  var out = inputs.outA + k * (inputs.outB - inputs.outA);\n\n  if (inputs.clip) {\n    if (inputs.outB > inputs.outA) {\n      out = Math.max(inputs.outA, out);\n      out = Math.min(inputs.outB, out);\n    } else {\n      out = Math.max(inputs.outB, out);\n      out = Math.min(inputs.outA, out);\n    }\n  }\n\n  return { out: out };\n};\n',
      },
      links: {},
      nodes: {
        noNativeImpl: {
          description: '',
          id: 'noNativeImpl',
          label: '',
          position: {
            x: 100,
            y: 100,
          },
          type: 'xod/patch-nodes/not-implemented-in-xod',
        },
        clip: {
          id: 'clip',
          type: 'xod/patch-nodes/input-boolean',
          position: {
            x: 1000,
            y: 0,
          },
          label: '',
          description: '',
        },
        inA: {
          id: 'inA',
          type: 'xod/patch-nodes/input-number',
          position: {
            x: 200,
            y: 0,
          },
          label: '',
          description: '',
        },
        inB: {
          id: 'inB',
          type: 'xod/patch-nodes/input-number',
          position: {
            x: 400,
            y: 0,
          },
          label: '',
          description: '',
        },
        inp: {
          id: 'inp',
          type: 'xod/patch-nodes/input-number',
          position: {
            x: 0,
            y: 0,
          },
          label: '',
          description: '',
        },
        out: {
          id: 'out',
          type: 'xod/patch-nodes/output-number',
          position: {
            x: 0,
            y: 300,
          },
          label: '',
          description: '',
        },
        outA: {
          id: 'outA',
          type: 'xod/patch-nodes/input-number',
          position: {
            x: 600,
            y: 0,
          },
          label: '',
          description: '',
        },
        outB: {
          id: 'outB',
          type: 'xod/patch-nodes/input-number',
          position: {
            x: 800,
            y: 0,
          },
          label: '',
          description: '',
        },
      },
      path: 'xod/core/map',
    },
    'xod/core/not': {
      impls: {
        js: '\nmodule.exports.evaluate = function(e) {\n  return { out: !e.inputs.in };\n};\n',
      },
      links: {},
      nodes: {
        noNativeImpl: {
          description: '',
          id: 'noNativeImpl',
          label: '',
          position: {
            x: 100,
            y: 100,
          },
          type: 'xod/patch-nodes/not-implemented-in-xod',
        },
        in: {
          id: 'in',
          type: 'xod/patch-nodes/input-boolean',
          position: {
            x: 0,
            y: 0,
          },
          label: '',
          description: '',
        },
        out: {
          id: 'out',
          type: 'xod/patch-nodes/output-boolean',
          position: {
            x: 0,
            y: 300,
          },
          label: '',
          description: '',
        },
      },
      path: 'xod/core/not',
    },
    'xod/core/or': {
      impls: {
        js: '\nmodule.exports.evaluate = function(e) {\n  return { out: e.inputs.a || e.inputs.b };\n};\n',
      },
      links: {},
      nodes: {
        noNativeImpl: {
          description: '',
          id: 'noNativeImpl',
          label: '',
          position: {
            x: 100,
            y: 100,
          },
          type: 'xod/patch-nodes/not-implemented-in-xod',
        },
        a: {
          id: 'a',
          type: 'xod/patch-nodes/input-boolean',
          position: {
            x: 0,
            y: 0,
          },
          label: '',
          description: '',
        },
        b: {
          id: 'b',
          type: 'xod/patch-nodes/input-boolean',
          position: {
            x: 200,
            y: 0,
          },
          label: '',
          description: '',
        },
        out: {
          id: 'out',
          type: 'xod/patch-nodes/output-boolean',
          position: {
            x: 0,
            y: 300,
          },
          label: '',
          description: '',
        },
      },
      path: 'xod/core/or',
    },
    'xod/core/output-boolean': {
      impls: {},
      links: {},
      nodes: {
        noNativeImpl: {
          description: '',
          id: 'noNativeImpl',
          label: '',
          position: {
            x: 100,
            y: 100,
          },
          type: 'xod/patch-nodes/not-implemented-in-xod',
        },
        __in__: {
          id: '__in__',
          type: 'xod/patch-nodes/input-boolean',
          position: {
            x: 0,
            y: 0,
          },
          label: '',
          description: '',
        },
      },
      path: 'xod/core/output-boolean',
    },
    'xod/core/output-number': {
      impls: {},
      links: {},
      nodes: {
        noNativeImpl: {
          description: '',
          id: 'noNativeImpl',
          label: '',
          position: {
            x: 100,
            y: 100,
          },
          type: 'xod/patch-nodes/not-implemented-in-xod',
        },
        __in__: {
          id: '__in__',
          type: 'xod/patch-nodes/input-number',
          position: {
            x: 0,
            y: 0,
          },
          label: '',
          description: '',
        },
      },
      path: 'xod/core/output-number',
    },
    'xod/core/output-pulse': {
      impls: {},
      links: {},
      nodes: {
        noNativeImpl: {
          description: '',
          id: 'noNativeImpl',
          label: '',
          position: {
            x: 100,
            y: 100,
          },
          type: 'xod/patch-nodes/not-implemented-in-xod',
        },
        __in__: {
          id: '__in__',
          type: 'xod/patch-nodes/input-pulse',
          position: {
            x: 0,
            y: 0,
          },
          label: '',
          description: '',
        },
      },
      path: 'xod/core/output-pulse',
    },
    'xod/core/output-string': {
      impls: {},
      links: {},
      nodes: {
        noNativeImpl: {
          description: '',
          id: 'noNativeImpl',
          label: '',
          position: {
            x: 100,
            y: 100,
          },
          type: 'xod/patch-nodes/not-implemented-in-xod',
        },
        __in__: {
          id: '__in__',
          type: 'xod/patch-nodes/input-string',
          position: {
            x: 0,
            y: 0,
          },
          label: '',
          description: '',
        },
      },
      path: 'xod/core/output-string',
    },
    'xod/core/pot': {
      impls: {
        espruino: '\nmodule.exports.setup = function(e) {\n  e.context.pin = new Pin(e.props.pin);\n};\n\nmodule.exports.evaluate = function(e) {\n  return { value: analogRead(e.context.pin) };\n};\n',
      },
      links: {},
      nodes: {
        noNativeImpl: {
          description: '',
          id: 'noNativeImpl',
          label: '',
          position: {
            x: 100,
            y: 100,
          },
          type: 'xod/patch-nodes/not-implemented-in-xod',
        },
        sample: {
          id: 'sample',
          type: 'xod/patch-nodes/input-pulse',
          position: {
            x: 0,
            y: 0,
          },
          label: '',
          description: '',
        },
        value: {
          id: 'value',
          type: 'xod/patch-nodes/output-number',
          position: {
            x: 0,
            y: 300,
          },
          label: '',
          description: '',
        },
      },
      path: 'xod/core/pot',
    },
    'xod/core/servo': {
      impls: {
        espruino: '\nmodule.exports.setup = function(e) {\n  e.context.pin = new Pin(e.props.pin);\n};\n\nmodule.exports.evaluate = function(e) {\n  var minPulse = +e.props.minPulse;\n  var maxPulse = +e.props.maxPulse;\n  var us = minPulse + (maxPulse - minPulse) * e.inputs.value;\n  analogWrite(e.context.pin, us / 20000, { freq: 50 });\n};\n',
      },
      links: {},
      nodes: {
        noNativeImpl: {
          description: '',
          id: 'noNativeImpl',
          label: '',
          position: {
            x: 100,
            y: 100,
          },
          type: 'xod/patch-nodes/not-implemented-in-xod',
        },
        maxPulse: {
          id: 'maxPulse',
          type: 'xod/patch-nodes/input-number',
          position: {
            x: 200,
            y: 0,
          },
          label: '',
          description: '',
        },
        minPulse: {
          id: 'minPulse',
          type: 'xod/patch-nodes/input-number',
          position: {
            x: 0,
            y: 0,
          },
          label: '',
          description: '',
        },
        value: {
          id: 'value',
          type: 'xod/patch-nodes/input-number',
          position: {
            x: 400,
            y: 0,
          },
          label: '',
          description: '',
        },
      },
      path: 'xod/core/servo',
    },
    'xod/core/sort-pair': {
      impls: {},
      links: {
        B17mF3zEcTg: {
          id: 'B17mF3zEcTg',
          input: {
            nodeId: 'BJ6KhzV5Te',
            pinKey: 'inp',
          },
          output: {
            nodeId: 'BkyeKhzV56l',
            pinKey: 'out',
          },
        },
        H1PXY2fE5pe: {
          id: 'H1PXY2fE5pe',
          input: {
            nodeId: 'BJsFnGN9pe',
            pinKey: '__in__',
          },
          output: {
            nodeId: 'BJ6KhzV5Te',
            pinKey: 'out',
          },
        },
        'HJ-7Y3zE56e': {
          id: 'HJ-7Y3zE56e',
          input: {
            nodeId: 'BkyeKhzV56l',
            pinKey: 'a',
          },
          output: {
            nodeId: 'rkYt3G49px',
            pinKey: '__out__',
          },
        },
        HJEXF3zVc6l: {
          id: 'HJEXF3zVc6l',
          input: {
            nodeId: 'HJRtnME96g',
            pinKey: 'inp',
          },
          output: {
            nodeId: 'BkyeKhzV56l',
            pinKey: 'out',
          },
        },
        Hk5XYhzE56g: {
          id: 'Hk5XYhzE56g',
          input: {
            nodeId: 'HJ2Y2GV56l',
            pinKey: '__in__',
          },
          output: {
            nodeId: 'HJRtnME96g',
            pinKey: 'out',
          },
        },
        Sy87Ynz49Te: {
          id: 'Sy87Ynz49Te',
          input: {
            nodeId: 'BJ6KhzV5Te',
            pinKey: 'falseValue',
          },
          output: {
            nodeId: 'B15Y3z45ae',
            pinKey: '__out__',
          },
        },
        rkG7FhzVqTx: {
          id: 'rkG7FhzVqTx',
          input: {
            nodeId: 'BkyeKhzV56l',
            pinKey: 'b',
          },
          output: {
            nodeId: 'B15Y3z45ae',
            pinKey: '__out__',
          },
        },
        rkY7K3M4cal: {
          id: 'rkY7K3M4cal',
          input: {
            nodeId: 'HJRtnME96g',
            pinKey: 'falseValue',
          },
          output: {
            nodeId: 'rkYt3G49px',
            pinKey: '__out__',
          },
        },
        ryHXt2fEqax: {
          id: 'ryHXt2fEqax',
          input: {
            nodeId: 'BJ6KhzV5Te',
            pinKey: 'trueValue',
          },
          output: {
            nodeId: 'rkYt3G49px',
            pinKey: '__out__',
          },
        },
        ry_Xt2MV5Tl: {
          id: 'ry_Xt2MV5Tl',
          input: {
            nodeId: 'HJRtnME96g',
            pinKey: 'trueValue',
          },
          output: {
            nodeId: 'B15Y3z45ae',
            pinKey: '__out__',
          },
        },
      },
      nodes: {
        B15Y3z45ae: {
          id: 'B15Y3z45ae',
          pins: {},
          position: {
            x: 671,
            y: 110,
          },
          type: 'xod/core/input-number',
        },
        BJ6KhzV5Te: {
          id: 'BJ6KhzV5Te',
          pins: {},
          position: {
            x: 332,
            y: 386,
          },
          type: 'xod/core/either',
        },
        BJsFnGN9pe: {
          id: 'BJsFnGN9pe',
          pins: {},
          position: {
            x: 327,
            y: 497,
          },
          type: 'xod/core/output-number',
        },
        BkyeKhzV56l: {
          id: 'BkyeKhzV56l',
          pins: {},
          position: {
            x: 422,
            y: 204,
          },
          type: 'xod/core/less',
        },
        HJ2Y2GV56l: {
          id: 'HJ2Y2GV56l',
          pins: {},
          position: {
            x: 528,
            y: 497,
          },
          type: 'xod/core/output-number',
        },
        HJRtnME96g: {
          id: 'HJRtnME96g',
          pins: {},
          position: {
            x: 535,
            y: 383,
          },
          type: 'xod/core/either',
        },
        rkYt3G49px: {
          id: 'rkYt3G49px',
          pins: {},
          position: {
            x: 134,
            y: 91,
          },
          type: 'xod/core/input-number',
        },
      },
      path: 'xod/core/sort-pair',
    },
    'xod/core/split-bool': {
      impls: {
        js: '\nmodule.exports.evaluate = function(e) {\n  if (e.inputs.inp) {\n    return { outTrue: PULSE };\n  } else {\n    return { outFalse: PULSE };\n  }\n};\n',
      },
      links: {},
      nodes: {
        noNativeImpl: {
          description: '',
          id: 'noNativeImpl',
          label: '',
          position: {
            x: 100,
            y: 100,
          },
          type: 'xod/patch-nodes/not-implemented-in-xod',
        },
        inp: {
          id: 'inp',
          type: 'xod/patch-nodes/input-boolean',
          position: {
            x: 0,
            y: 0,
          },
          label: '',
          description: '',
        },
        outFalse: {
          id: 'outFalse',
          type: 'xod/patch-nodes/output-pulse',
          position: {
            x: 200,
            y: 300,
          },
          label: '',
          description: '',
        },
        outTrue: {
          id: 'outTrue',
          type: 'xod/patch-nodes/output-pulse',
          position: {
            x: 0,
            y: 300,
          },
          label: '',
          description: '',
        },
      },
      path: 'xod/core/split-bool',
    },
    'xod/core/stdout': {
      impls: {
        nodejs: 'module.exports.evaluate = function(e) {\n  var val = String(e.inputs.value);\n  process.stdout.write(val);\n};\n',
      },
      links: {},
      nodes: {
        noNativeImpl: {
          description: '',
          id: 'noNativeImpl',
          label: '',
          position: {
            x: 100,
            y: 100,
          },
          type: 'xod/patch-nodes/not-implemented-in-xod',
        },
        value: {
          id: 'value',
          type: 'xod/patch-nodes/input-string',
          position: {
            x: 0,
            y: 0,
          },
          label: '',
          description: '',
        },
      },
      path: 'xod/core/stdout',
    },
    'xod/core/time': {
      impls: {
        js: 'module.exports.evaluate = function(e) {\n  return { value: new Date().getTime() };\n};\n',
      },
      links: {},
      nodes: {
        noNativeImpl: {
          description: '',
          id: 'noNativeImpl',
          label: '',
          position: {
            x: 100,
            y: 100,
          },
          type: 'xod/patch-nodes/not-implemented-in-xod',
        },
        pulse: {
          id: 'pulse',
          type: 'xod/patch-nodes/input-pulse',
          position: {
            x: 0,
            y: 0,
          },
          label: '',
          description: '',
        },
        value: {
          id: 'value',
          type: 'xod/patch-nodes/output-number',
          position: {
            x: 0,
            y: 300,
          },
          label: '',
          description: '',
        },
      },
      path: 'xod/core/time',
    },
    'xod/core/triggerable-number': {
      impls: {
        js: '\nmodule.exports.evaluate = function(e) {\n  return { out: e.props.value };\n};\n',
      },
      links: {},
      nodes: {
        noNativeImpl: {
          description: '',
          id: 'noNativeImpl',
          label: '',
          position: {
            x: 100,
            y: 100,
          },
          type: 'xod/patch-nodes/not-implemented-in-xod',
        },
        out: {
          id: 'out',
          type: 'xod/patch-nodes/output-number',
          position: {
            x: 0,
            y: 300,
          },
          label: '',
          description: '',
        },
        trigOn: {
          id: 'trigOn',
          type: 'xod/patch-nodes/input-pulse',
          position: {
            x: 0,
            y: 0,
          },
          label: '',
          description: '',
        },
        value: {
          id: 'value',
          type: 'xod/patch-nodes/input-number',
          position: {
            x: 200,
            y: 0,
          },
          label: '',
          description: '',
        },
      },
      path: 'xod/core/triggerable-number',
    },
    'xod/core/ultrasonic-hc-sr04': {
      impls: {
        espruino: "\nvar sonic = require('@amperka/ultrasonic');\n\nmodule.exports.setup = function(e) {\n  var pinTrig = new Pin(e.props.pinTrig);\n  var pinEcho = new Pin(e.props.pinEcho);\n  e.context.device = sonic.connect({\n    trigPin: pinTrig,\n    echoPin: pinEcho\n  });\n  e.context.units = e.props.units;\n  e.context.isBusy = false;\n};\n\nmodule.exports.evaluate = function(e) {\n  if (e.context.isBusy) {\n    e.fire({ error: \"busy\" });\n  } else {\n    e.context.isBusy = true;\n    e.context.device.ping(function(err, value) {\n      e.context.isBusy = false;\n      if (err) {\n        e.fire({ error: err.msg });\n      } else {\n        e.fire({ value: value });\n      }\n    }, e.context.units);\n  }\n};\n",
      },
      links: {},
      nodes: {
        noNativeImpl: {
          description: '',
          id: 'noNativeImpl',
          label: '',
          position: {
            x: 100,
            y: 100,
          },
          type: 'xod/patch-nodes/not-implemented-in-xod',
        },
        error: {
          id: 'error',
          type: 'xod/patch-nodes/output-string',
          position: {
            x: 200,
            y: 300,
          },
          label: '',
          description: '',
        },
        sample: {
          id: 'sample',
          type: 'xod/patch-nodes/input-pulse',
          position: {
            x: 0,
            y: 0,
          },
          label: '',
          description: '',
        },
        units: {
          id: 'units',
          type: 'xod/patch-nodes/input-string',
          position: {
            x: 200,
            y: 0,
          },
          label: '',
          description: '',
        },
        value: {
          id: 'value',
          type: 'xod/patch-nodes/output-number',
          position: {
            x: 0,
            y: 300,
          },
          label: '',
          description: '',
        },
      },
      path: 'xod/core/ultrasonic-hc-sr04',
    },
    'xod/core/valveNumber': {
      impls: {
        js: '\nmodule.exports.evaluate = function(e) {\n  if (e.inputs.cond) {\n    e.fire({ out: e.inputs.in });\n  }\n};\n',
      },
      links: {},
      nodes: {
        noNativeImpl: {
          description: '',
          id: 'noNativeImpl',
          label: '',
          position: {
            x: 100,
            y: 100,
          },
          type: 'xod/patch-nodes/not-implemented-in-xod',
        },
        cond: {
          id: 'cond',
          type: 'xod/patch-nodes/input-boolean',
          position: {
            x: 0,
            y: 0,
          },
          label: '',
          description: '',
        },
        in: {
          id: 'in',
          type: 'xod/patch-nodes/input-number',
          position: {
            x: 200,
            y: 0,
          },
          label: '',
          description: '',
        },
        out: {
          id: 'out',
          type: 'xod/patch-nodes/output-number',
          position: {
            x: 0,
            y: 300,
          },
          label: '',
          description: '',
        },
      },
      path: 'xod/core/valveNumber',
    },
    'xod/math/add': {
      impls: {
        js: '\nmodule.exports.evaluate = function(e) {\n  return { out: (e.inputs.a + e.inputs.b) };\n};\n',
      },
      links: {},
      nodes: {
        noNativeImpl: {
          description: '',
          id: 'noNativeImpl',
          label: '',
          position: {
            x: 100,
            y: 100,
          },
          type: 'xod/patch-nodes/not-implemented-in-xod',
        },
        a: {
          id: 'a',
          type: 'xod/patch-nodes/input-number',
          position: {
            x: 0,
            y: 0,
          },
          label: '',
          description: '',
        },
        b: {
          id: 'b',
          type: 'xod/patch-nodes/input-number',
          position: {
            x: 200,
            y: 0,
          },
          label: '',
          description: '',
        },
        out: {
          id: 'out',
          type: 'xod/patch-nodes/output-number',
          position: {
            x: 0,
            y: 300,
          },
          label: '',
          description: '',
        },
      },
      path: 'xod/math/add',
    },
    'xod/math/divide': {
      impls: {
        js: '\nmodule.exports.evaluate = function(e) {\n  return { out: (e.inputs.a / e.inputs.b) };\n};\n',
      },
      links: {},
      nodes: {
        noNativeImpl: {
          description: '',
          id: 'noNativeImpl',
          label: '',
          position: {
            x: 100,
            y: 100,
          },
          type: 'xod/patch-nodes/not-implemented-in-xod',
        },
        a: {
          id: 'a',
          type: 'xod/patch-nodes/input-number',
          position: {
            x: 0,
            y: 0,
          },
          label: '',
          description: '',
        },
        b: {
          id: 'b',
          type: 'xod/patch-nodes/input-number',
          position: {
            x: 200,
            y: 0,
          },
          label: '',
          description: '',
        },
        out: {
          id: 'out',
          type: 'xod/patch-nodes/output-number',
          position: {
            x: 0,
            y: 300,
          },
          label: '',
          description: '',
        },
      },
      path: 'xod/math/divide',
    },
    'xod/math/multiply': {
      impls: {
        cpp: 'struct State {\n};\n\n{{ GENERATED_CODE }}\n\nvoid evaluate(NodeId nid, State* state) {\n    const Number in1 = getNumber(nid, Inputs::A);\n    const Number in2 = getNumber(nid, Inputs::B);\n    emitNumber(nid, Outputs::OUT, in1 * in2);\n}\n',
        js: '\nmodule.exports.evaluate = function(e) {\n  return { out: (e.inputs.a * e.inputs.b) };\n};\n',
      },
      links: {},
      nodes: {
        noNativeImpl: {
          description: '',
          id: 'noNativeImpl',
          label: '',
          position: {
            x: 100,
            y: 100,
          },
          type: 'xod/patch-nodes/not-implemented-in-xod',
        },
        a: {
          id: 'a',
          type: 'xod/patch-nodes/input-number',
          position: {
            x: 0,
            y: 0,
          },
          label: '',
          description: '',
        },
        b: {
          id: 'b',
          type: 'xod/patch-nodes/input-number',
          position: {
            x: 200,
            y: 0,
          },
          label: '',
          description: '',
        },
        out: {
          id: 'out',
          type: 'xod/patch-nodes/output-number',
          position: {
            x: 0,
            y: 300,
          },
          label: '',
          description: '',
        },
      },
      path: 'xod/math/multiply',
    },
    'xod/math/subtrac': {
      impls: {
        js: '\nmodule.exports.evaluate = function(e) {\n  return { out: (e.inputs.a - e.inputs.b) };\n};\n',
      },
      links: {},
      nodes: {
        noNativeImpl: {
          description: '',
          id: 'noNativeImpl',
          label: '',
          position: {
            x: 100,
            y: 100,
          },
          type: 'xod/patch-nodes/not-implemented-in-xod',
        },
        a: {
          id: 'a',
          type: 'xod/patch-nodes/input-number',
          position: {
            x: 0,
            y: 0,
          },
          label: '',
          description: '',
        },
        b: {
          id: 'b',
          type: 'xod/patch-nodes/input-number',
          position: {
            x: 200,
            y: 0,
          },
          label: '',
          description: '',
        },
        out: {
          id: 'out',
          type: 'xod/patch-nodes/output-number',
          position: {
            x: 0,
            y: 300,
          },
          label: '',
          description: '',
        },
      },
      path: 'xod/math/subtrac',
    },
  },
};
