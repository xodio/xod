export default {
  CLOUD_COMPILE_UNSPUPPORTED: ({ boardName }) => ({
    title: 'Cloud compilation not supported',
    note: `Cloud compilation does not support ${boardName} yet.`,
    solution: 'Try to compile it on your own computer',
  }),
  UPLOAD_TOOL_ERROR: ({ message }) => ({
    title: 'Upload tool exited with error',
    note: `Command ${message}`,
    solution:
      'Make sure the board is connected, the cable is working, the board model set correctly, the upload port belongs to the board, the board drivers are installed, the upload options (if any) match your board specs.',
  }),
};
