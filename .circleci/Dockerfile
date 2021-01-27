FROM cimg/node:12.16.3

# See https://github.com/GoogleChrome/puppeteer/blob/master/docs/troubleshooting.md#running-puppeteer-in-docker
RUN echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list \
    && curl https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add - 2>/dev/null

RUN sudo apt-get update \
    && sudo apt-get install -y --no-install-recommends \
        # See https://crbug.com/795759
        libgconf-2-4 \
        # Install latest chrome dev package.
        # Note: this installs the necessary libs to make the bundled version of Chromium that Puppeteer
        # installs, work.
        google-chrome-unstable \
        # Dependencies for Electron, Spectron, electron-builder
        libasound2 \
        libgconf-2-4 \
        libgtk2.0-0 \
        libnss3 \
        libx11-xcb-dev \
        libxss1 \
        libxtst6 \
        rpm \
        xvfb \
    && sudo rm -rf /var/lib/apt/lists/*
