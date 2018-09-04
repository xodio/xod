FROM node:10

# Let the apt-get know we’re not interactive while building the image
ARG DEBIAN_FRONTEND=noninteractive

# Installations for later installations
RUN apt-get update \
    # Required for some later packages to be configured
    && apt-get install -y --no-install-recommends apt-utils \
    && apt-get install -y --no-install-recommends \
        # apt-add-repository
        software-properties-common \
        # Required for Docker CE
        apt-transport-https

# See https://github.com/GoogleChrome/puppeteer/blob/master/docs/troubleshooting.md#running-puppeteer-in-docker
RUN curl https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && add-apt-repository "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main"

# Add Docker CE repository. We use docker to build and push the browser IDE image
RUN curl https://download.docker.com/linux/debian/gpg | apt-key add - \
    && add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/debian $(lsb_release -cs) stable"

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        docker-ce \
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
