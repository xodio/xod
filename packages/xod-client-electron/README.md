# xod-client-electron

This package is a part of the [XOD](https://github.com/xodio/xod) project.

The package is a thin wrapper around
[`xod-client`](https://github.com/xodio/xod/tree/master/packages/xod-client)
which lifts it to a ready-to-use desktop based XOD IDE.

It is based on [Electron](https://electron.atom.io/).

## Package gotchas

### Always rebuild native dependencies from source

For `electron-builder` we have to provide option:

```
"buildDependenciesFromSource": true
```

to properly build `serialport` native package when creating distributives.
Otherwise it would be compiled against wrong version of Node ABI. Following
issues have to be solved before we could drop the option:

- https://github.com/EmergingTechnologyAdvisors/node-serialport/issues/1180
- https://github.com/EmergingTechnologyAdvisors/node-serialport/issues/1263

### Dedicate dist directory to electron-builder

All other packages use `dist/` as a target of transpilation,
`xod-client-electron` is not because `dist` name used to be reserved for
distro packaging. It uses `src-babel/` as a target for transpilation.

It have to be fixed since now `electron-builder` supports `directories/output`
option.

### `electron-builder` support for lerna + yarn-workspaces monorepos

For now the [official support](https://github.com/electron-userland/electron-builder/issues/2205) is a bit broken, so in the meantime we use [our own fork](https://github.com/xodio/electron-builder/tree/look-for-node_modules-until-root)


