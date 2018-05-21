export default err => ({
  title: 'Error',
  note: err.message,
  solution:
    'The error was not caught, which is a bug. Report the issue to XOD developers.',
});
