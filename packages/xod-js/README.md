# XOD-JS

This package provides functions that transpiles Project into javascript code.

Platform-specific functions always takes two arguments: Project and Path to an entry-point patch.

Now it supports platforms:
- Espruino (`transpileForEspruino`)
- NodeJS (`transpileForNodeJS`)

## How it works
The transpiled code is a composition of a default javascript runtime, patch implementations
and platform-specific launcher.

Patches (generally, that represents hardware) could have a platform-specific implementations.
For example, `and` patch have a common implementation on JS, but `digital_output` have a
different implementations for Espruino (uses native `digitalWrite` function) and NodeJS (uses
native `fs.writeFile`).

Platform-specific launcher always runs `Project.launcher()`, but do it in the best way for
the platform. For example, on NodeJS — just run it, but on Espruino wrap with function
named `onInit` (that will be called automatically on init by Espruino).

Also launchers could have a platform-specific hacks, resets and etc.

## How to implement new javascript-based platform
All Platform-specified functions is based on general `transpile` function, that accepts
an object with options:
- Project
- Path to entry-point patch
- Array of target implementations (e.g., `['espruino', 'js']`)
- String with launcher code (it's platform-specific code)

To implement new platform-specific transpiling function you should create:
1. launcher file in `platform/YOUR_PLATFORM_NAME/launcher.js`,
2. function in `src/target-PLATFORM_NAME.js` (see current targets for example),
3. add platform-specific implementations into `xod-stdlib`,
4. add a mapping to files in the `xod-fs/loadLibs.js` (see `implAccordance`),
5. make it callable (update `xod-cli` and `xod-client`)
