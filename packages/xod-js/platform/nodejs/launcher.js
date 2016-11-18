// A2 is set to HIGH after reset for some reason.
// Force it to shut down with a hack.

function onInit() {
  digitalWrite('A2', false); // TODO: remove hack
  project.launch();
}

if (typeof module !== 'undefined') {
  // Export some entities for tests
  module.exports.onInit = onInit;
}
