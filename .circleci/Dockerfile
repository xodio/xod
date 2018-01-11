FROM node:9.2

RUN apt-get update && apt-get install -y --no-install-recommends \
    wget

# see https://github.com/GoogleChrome/puppeteer/blob/master/docs/troubleshooting.md#running-puppeteer-in-docker
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list'

RUN apt-get update && apt-get install -y --no-install-recommends \
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
    xvfb

RUN rm -rf /var/lib/apt/lists/* \
    && apt-get purge --auto-remove -y curl \
    && rm -rf /src/*.deb
