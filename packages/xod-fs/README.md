# xod-fs

This package is a part of the [XOD](https://github.com/xodio/xod) project.

The package provides API to work with workspaces, libraries and projects that are stored as different files on the file system. It lets converting between normal (split files), xodball (single project monolith), and RAM representation.

Since it requires access to file system `xod-fs` is used by `xod-cli` and `xod-client-electron` packages. It is not used by `xod-client-browser` because a browser has no full access to user’s file system.
