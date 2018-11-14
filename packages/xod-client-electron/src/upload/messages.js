export default {
  CLOUD_COMPILE_UNSPUPPORTED: ({ boardName }) => ({
    title: 'Cloud compilation not supported',
    note: `Cloud compilation does not support ${boardName} yet.`,
    solution: 'Try to compile it on your own computer',
  }),
};
