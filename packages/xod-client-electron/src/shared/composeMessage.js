// Duplicate of `composeMessage` from `xod-client`
// It's necessary to prevent errors with importing `xod-client`,
// that contains styles and react components.
export default (title, note = null, button = null) => ({
  title,
  note,
  button,
});
