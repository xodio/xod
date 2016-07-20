function init() {
  const options = {
    frame: 'chrome',
    minWidth: 640,
    minHeight: 480,
    width: 1024,
    height: 768,
  };

  const onCreate = window => window.onClosed.addListener(disconnectAll);
  chrome.app.window.create('index.html', options, onCreate);
}

chrome.app.runtime.onLaunched.addListener(init);

function disconnectAll() {
  chrome.serial.getConnections(function(connections) {
    connections.forEach(c => {
      chrome.serial.disconnect(c.connectionId, _ => null);
    });
  });
}
