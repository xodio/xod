
function disconnectAll() {
  chrome.serial.getConnections(connections => {
    connections.forEach(c => {
      chrome.serial.disconnect(c.connectionId, () => null);
    });
  });
}

chrome.app.runtime.onLaunched.addListener(() => {
  const options = {
    frame: 'chrome',
    minWidth: 640,
    minHeight: 480,
    width: 1024,
    height: 768,
  };

  const onCreate = window => window.onClosed.addListener(disconnectAll);
  chrome.app.window.create('index.html', options, onCreate);
});
