# Arduino-cli

A javascript wrapper over the [arduino-cli](https://github.com/arduino/arduino-cli) tool

**Works on Arduino-cli 0.3.1-alpha.preview**

## How to use

1. Install it with `npm install -S arduino-cli` or `yarn add arduino-cli`;
2. Require in the code `import arduinoCli from 'arduino-cli';`
3. Create an instance and pass the path to the installed `arduino-cli` and config:
   ```js
     const cli = arduinoCli('/bin/arduino-cli', {
       arduino_data: '~/arduino-cli/data',
       sketchbook_path: '~/arduino-cli/sketches',
     });
   ```
   It will create a config file for the `arduino-cli` in your OS temp directory and pass it to any command you'll call later.
4. Then you can run commands, like this:
   ```js
     cli.version().then(console.log); // "0.2.1-alpha.preview"
   ```

## API
All commands runs asynchronously, so methods return `Promise`s.

### version()
Returns the version of `arduino-cli`.
Wraps `arduino-cli version`.

- Returns `Promise<String>`

### dumpConfig()
Returns the current config of `arduino-cli` as a plain JS object.
Wraps `arduino-cli config dump`.

- Returns `Promise<Object>`

### updateConfig(newConfig)
Replaces old config with the new one.

Accepts:
- `newConfig` `<Object>` — Plain JS object representation of `.cli-config.yml`

- Returns `<Object>` with the new config

### listConnectedBoards()
A wrapper with a custom extension over `arduino-cli board list`.

*Custom extension may be removed in the future. See [issue #45](https://github.com/arduino/arduino-cli/issues/45)*

Returns a plain JS object which describes boards connected through serial ports.
Also, it extends boards' FQBN with `cpu` option from `boards.txt` if
a board is identified (a package installed) and has some options.
For example, `Arduino Nano` will be transformed into three items with a modified FQBN and name.

- Returns `Promise<Array<ConnectedBoard>>`

### listInstalledBoards()
A wrapper with a custom extension over `arduino-cli board listall`.

*Custom extension may be removed in the future. See [issue #45](https://github.com/arduino/arduino-cli/issues/45)*

Returns a plain JS object with boards, whose packages are installed.
Also, it extends boards' FQBN with `cpu` option from `boards.txt` if
a board is identified (a package installed) and it has some options.
For example, `Arduino Nano` will be transformed into three items with a modified FQBN and name.

- Returns `Promise<Array<InstalledBoard>>`

### listAvailableBoards()
Returns a list of all boards that found in all `package_*_index.json` files.

- Returns `Promise<Array<AvailableBoard>>`

### addPackageIndexUrl(url)
Adds an additional package index URL to the config file.
Later you can download and install the package with `arduino-cli` (call `core.updateIndex()`).

Accepts:
- `url` `<String>` — a URL of the third-party `package_*_index.json` file

- Returns `Promise<String>` with the just added URL

### addPackageIndexUrls(urls)
Adds a list of additional package index urls into the config file.
Later you can download and install packages with `arduino-cli` (call `core.updateIndex()`).

Accepts:
- `urls` `<Array<String>>` — List of URLs of the third-party `package_*_index.json` files

- Returns `Promise<Array<String>>` with just added URLs

### core.download(progressCallback, packageName)
Wraps `arduino-cli core download packageName`.
Downloads core and tool archives for the specified package.

Accepts:
- `progressCallback` `<Function>` — A function that will be called on progress with one argument `<ProgressData>`. See details below.
- `packageName` `<String>` — A package and architecture to download. May contain a version. For example, `arduino:avr` or `arduino:avr@1.6.9`

- Returns `Promise<String>` — log

### core.install(progressCallback, packageName)
Wraps `arduino-cli core install packageName`.
Downloads and installs core and tool archives for the specified package.

Accepts:
- `progressCallback` `<Function>` — A function that will be called on progress with one argument `<ProgressData>`. See details below.
- `packageName` `<String>` — A package and architecture to install. May contain a version. For example, `arduino:avr` or `arduino:avr@1.6.9`

- Returns `Promise<String>` — log

### core.list()
Wraps `arduino-cli core list`.
Returns a list of installed packages.

- Returns `Promise<Array<InstalledPackages>>`

### core.search(query)
Wraps `arduino-cli core search query`.
Returns a list of packages found.

Accepts:
- `query` `<String>` — A search query

- Returns `Promise<Array<FoundPackages>>`

### core.uninstall(packageName)
Wraps `arduino-cli core uninstall packageName`.
Uninstalls the core and tools for the specified package.

Accepts:
- `packageName` `<String>` — A package identifier, like `arduino:samd`

- Returns `Promise<String>` — a log

### core.updateIndex()
Wraps `arduino-cli core update-index`.
Downloads the original `package_index.json` and additional package index files.

- Returns `Promise<String>` — a log

### createSketch(sketchName)
Wraps `arduino-cli sketch new sketchName`.
Creates an empty `sketchName/sketchName.ino` inside the sketchbook directory.

- Returns `Promise<String>` — a full path to the created `.ino` file

### compile(onProgress, fqbn, sketchName[, verbose])
Wraps `arduino-cli compile`.
Compiles the sketch for the specified board.

Accepts:
- `onProgress` `<Function>` — A function that is called on new data in `stdout`
- `fqbn` `<String>` — A fully-qualified board name. Like `arduino:avr:mega:cpu=atmega2560`
- `sketchName` `<String>` — A name of the sketch in the sketchbook directory.
  It can contain sketch name or full path to the sketch.
- `verbose` `<Boolean>` — Verbose output. By default is `false`

- Returns `Promise<String>` with a log of the compilation process

### upload(onProgress, port, fqbn, sketchName[, verbose])
Wraps `arduino-cli upload`.
Uploads the compiled sketch onto the board.

Accepts:
- `onProgress` `<Function>` — A function that is called on new data in `stdout` with a single argument
- `port` `<String>` — A port name (e.g., `COM3` or `/dev/tty.usbmodem1411`)
- `fqbn` `<String>` — A fully-qualified board name. Like `arduino:avr:mega:cpu=atmega2560`
- `sketchName` `<String>` — A name of the sketch in the sketchbook directory.
  It can contain sketch name or full path to the sketch.
- `verbose` `<Boolean>` — Verbose output. By default is `false`

- Returns `Promise<String>` with a log of the upload process

### getRunningProcesses()
Returns a list of running `arduino-cli` processes.

- Returns `Array<ChildProcess>`

### killProcesses()
Kills all running `arduino-cli` processes.

- Returns `Boolean` `true`

## Types

### ConnectedBoard
- `name` `<String>` — A board name with an added cpu option, if it exists
  For example, "Arduino/Genuino Uno" or "Arduino/Genuino Mega2560 (ATmega2560 (Mega 2560))"
- `fqbn` `<String>` — A fully-qualified board name
  For example, `arduino:avr:uno` or `arduino:avr:mega2560:cpu=atmega2560`
- `port` `<String>` — A port name. Like `/dev/tty.usbmodem1411`
- `usbID` `String` — An ID of the board (VID, PID). For example, `2341:0042`

### InstalledBoard
- `name` `<String>` — A board name
  E.G. "Arduino/Genuino Uno" or "Arduino/Genuino Mega2560"
- `fqbn` `<String>` — A fully-qualified board name
  E.G. "arduino:avr:uno" or "arduino:avr:mega2560"
- `options` `<Array<Option>>` — a list of options for this board

### Option
Object, that represents one group of the board option. For example, CPU Frequency.
- `optionName` `<String>` — A human-readable name of the option group ("CPU Frequency")
- `optionId` `<String>` — An id of the option from `boards.txt`. E.G. `CpuFrequency`
- `values` `<Array<OptionValue>>` — a list of option values, that represented as objects
  with two fields
  - `name` `<String>` — A human-readable option name ("80 MHz")
  - `value` `<String>` — A value, that will be used by tools. ("80")

### AvailableBoard
- `name` `<String>` — A board name (e.g., "Arduino/Genuino Mega2560")
- `package` `<String>` — A package and architecture, that could be used in the `core.install` command.
  For example, `arduino:avr`
- `packageName` `<String>` — A human-readable architecture name. Like "Arduino AVR Boards"
- `version` `<String>` — A Semver of the latest architecture for this board (e.g., `1.6.21`)

### ProgressData
- `message` `<String>` — A progress message from stdout of the `arduino-cli`.
   In case that there is a downloading process that shows progress bar, it will be
   `null`, because this type of progress should notify only about a percentage.
- `percentage` `<Number>` — A number in the range [0.00...100.00]
- `estimated` `<String>` — An estimated time in the format `3m52s` or `unknown`

### InstalledPackages
- `ID` `<String>` — A package identifier in format `package:architecture` (e.g., `arduino:avr`)
- `Installed` `<String>` — A version of the installed package
- `Latest` `<String>` — A version of the latest package
- `Name` `<String>` — A human-readable name of the architecture

### FoundPackages
- `ID` `<String>` — A package identifier in format `package:architecture` (e.g., `arduino:avr`)
- `Version` `<String>` — A version of the latest package
- `Installed` `<String>` — Equals "Yes" if the package is installed, otherwise "No"
- `Name` `<String>` — A name of the architecture
