function init() {
  const options = {
    frame: 'chrome',
    minWidth: 640,
    minHeight: 480,
    width: 1024,
    height: 768,
  };

  chrome.app.window.create('index.html', options);
}

chrome.app.runtime.onLaunched.addListener(init);
