# xod-deploy
This package is a part of the [XOD](https://github.com/xodio/xod) project.

The package provides cloud compilation feature.

## Development
This package uses web socket server to compile code and http server to get upload
config for boards. It uses a default URLs, that coded in the constants, but for
better development experience it could be changed by environment variables.

  - **XOD_CLOUD_UPLOAD_CONFIG_URL** — URL, that returns upload config for a board.
    Board identifier is appended at the end of the url, so
    `https://compile.xod.io/upload/` will be used like `https://compile.xod.io/upload/uno`

  - **XOD_CLOUD_COMPILE_URL** — URL for web socket server.
    E.G. `wss://compile.xod.io/compile`
