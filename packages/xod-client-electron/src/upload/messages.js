export default {
  CLOUD_COMPILE_UNSPUPPORTED: ({ boardName }) => ({
    title: 'Cloud compilation not supported',
    note: `Cloud compilation does not support ${boardName} yet.`,
    solution: 'Try to compile it on your own computer',
  }),
  COMPILE_TOOL_ERROR: ({ message }) => ({
    title: 'Compilation failed',
    note: `Command ${message}`,
    solution:
      'The generated C++ code contains errors. It can be due to a bad node implementation or if your board is not compatible with XOD runtime code. The original compiler error message is above. Fix C++ errors to continue. If you believe it is a bug, report the problem to XOD developers.',
  }),
  UPLOAD_TOOL_ERROR: ({ message }) => ({
    title: 'Upload failed',
    note: `Command ${message}`,
    solution:
      'Make sure the board is connected, the cable is working, the board model set correctly, the upload port belongs to the board, the board drivers are installed, the upload options (if any) match your board specs.',
  }),
  UPLOADED_SUCCESSFULLY: () => ({
    title: 'Uploaded successfully',
  }),
};
