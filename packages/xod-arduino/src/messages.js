// Stanza creators.
// See `xod-func-tools` package Stanza type
export default {
  TOO_MANY_OUTPUTS_FOR_NATIVE_NODE: ({ patchPath }) => ({
    title: 'Too many outputs',
    note: `C++ node ${patchPath} has more than 7 outputs. This is a limit for nodes implemented natively.`,
    solution:
      'Try to express the node as a XOD patch node composed of smaller C++ nodes or group the outputs into a new custom type.',
  }),
};
