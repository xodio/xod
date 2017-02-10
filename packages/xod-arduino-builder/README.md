# XOD project: Arduino Builder

The builder wraps Arduino IDE into `nodejs` `Promise`-based cli interface.

## Prerequisites

- [Arduino IDE](https://www.arduino.cc/en/main/software) must be installed;
- Arduino IDE [executable](https://github.com/arduino/Arduino/blob/master/build/shared/manpage.adoc) must be callable;
- Arduino IDE `packages/` folder must be reachable.

## Example

Start `node` cli session:

```bash
node
```

Import the builder and set utility display function:

```javascript
const xab = require('./dist/index.js');
const c = promise => promise.then(
  value => (console.log(value), Promise.resolve(value)),
  error => (console.error(error), Promise.reject(error))
);
```

Set paths to Arduino IDE executable and packages:

```javascript
c(xab.setArduinoIdePathExecutable('/home/alexander-matsievsky/programs/arduino-1.8.1/arduino'));
c(xab.setArduinoIdePathPackages('/home/alexander-matsievsky/.arduino15/packages'));
```

View the raw [official Arduino package index](http://downloads.arduino.cc/packages/package_index.json):

```javascript
c(xab.listPackageIndex());
```

View the processed package index optimized for `pav` selection:

```javascript
c(xab.listPAVs());
const pav = {
  package: 'arduino',
  architecture: 'avr',
  version: '1.6.16'    
};
```

Install the selected `pav`:

```javascript
c(xab.installPAV(pav));
```

View the boards supported by the selected `pav`:

```javascript
c(xab.listPAVBoards(pav));
const pab = {
  package: pav.package,
  architecture: pav.architecture,
  board: 'uno'    
};
```

Compile the `file` for the selected `pab`:

```javascript
const file = '/home/alexander-matsievsky/programs/arduino-1.8.1/examples/01.Basics/Blink/Blink.ino';
c(xab.verify(pab, file));
```

View the available serial `port`s:

```javascript
c(xab.listPorts());
const port = '/dev/ttyACM0';
```

Compile and upload the `file` for the selected `pab` at the specified `port`:

```javascript
c(xab.upload(pab, port, file));
```