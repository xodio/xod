# xod-cli

This package is a part of the [XOD](https://github.com/xodio/xod) project.

The package contains implemetation of `xodc` command line utility.

Basically it’s a collection of thin wrappers around NodeJS API’s available via other packages. The responsibility of `xod-cli` is to parse command line arguments, call API, and format the result on stdout/stderr properly.

`xodc` uses subcommands like `git` does to perform various functions. The subcommands handling could be found in `src/commands/*.js`.

<!-- toc -->
* [xod-cli](#xod-cli)
* [Flags, aliases, environment variables](#flags-aliases-environment-variables)
* [Commands](#commands)
<!-- tocstop -->

# Flags, aliases, environment variables

Almost any flag can be replaced with the appropriate environment variable. For example, instead of `--username` you can declare variable `XOD_USERNAME`.

| Flag         | Alias | Environment variable |
| ------------ | ----- | -------------------- |
| --api        |       | XOD_API              |
| --board      | -b    | XOD_BOARD            |
| --debug      |       | XOD_DEBUG            |
| --on-behalf  |       | XOD_ONBEHALF         |
| --output     | -o    | XOD_OUTPUT           |
| --output-dir | -o    | XOD_OUTPUT           |
| --password   |       | XOD_PASSWORD         |
| --port       | -p    | XOD_PORT             |
| --username   |       | XOD_USERNAME         |
| --workspace  | -w    | XOD_WORKSPACE        |

# Commands

<!-- commands -->
* [`xodc autocomplete [SHELL]`](#xodc-autocomplete-shell)
* [`xodc boards [options]`](#xodc-boards-options)
* [`xodc compile [options] [entrypoint]`](#xodc-compile-options-entrypoint)
* [`xodc help [COMMAND]`](#xodc-help-command)
* [`xodc install:arch [fqbn]`](#xodc-installarch-fqbn)
* [`xodc publish [options] [project]`](#xodc-publish-options-project)
* [`xodc resave [options] [project]`](#xodc-resave-options-project)
* [`xodc tabtest [options] [entrypoint]`](#xodc-tabtest-options-entrypoint)
* [`xodc transpile [options] [entrypoint]`](#xodc-transpile-options-entrypoint)
* [`xodc upload [options] [entrypoint]`](#xodc-upload-options-entrypoint)

## `xodc autocomplete [SHELL]`

display autocomplete installation instructions

```
USAGE
  $ xodc autocomplete [SHELL]

ARGUMENTS
  SHELL  shell type

OPTIONS
  -r, --refresh-cache  Refresh cache (ignores displaying instructions)

EXAMPLES
  $ xodc autocomplete
  $ xodc autocomplete bash
  $ xodc autocomplete zsh
  $ xodc autocomplete --refresh-cache
```

_See code: [@oclif/plugin-autocomplete](https://github.com/oclif/plugin-autocomplete/blob/v0.1.0/src/commands/autocomplete/index.ts)_

## `xodc boards [options]`

show available boards

```
USAGE
  $ xodc boards [options]

OPTIONS
  -V, --version         show CLI version
  -h, --help            show CLI help
  -q, --quiet           do not log messages other than errors
  -w, --workspace=path  [default: ~/xod] use the workspace specified, defaults to $HOME/xod
```

_See code: [src/commands/boards.js](https://github.com/xodio/xod/blob/master/packages/xod-cli/src/commands/boards.js)_

## `xodc compile [options] [entrypoint]`

compiles (verifies) a XOD program

```
USAGE
  $ xodc compile [options] [entrypoint]

ARGUMENTS
  ENTRYPOINT
      Project and/or patch to operate on. The project should point to a file or
      directory on the file system. The patch may either point to file system or
      be a XOD patch path. If either is omitted, it is inferred from the current
      working directory or another argument. Examples:

         * ./path/to/proj.xodball main      # xodball + patch name
         * ./path/to/proj/main/patch.xodp   # just full path to a patch
         * main                             # a patch in the current project

OPTIONS
  -V, --version         show CLI version
  -b, --board=fqbn      (required) target board identifier (see `xodc boards` output)
  -h, --help            show CLI help

  -o, --output=path     save the result binary to the directory; the same directory is used for intermediate build
                        artifacts; defaults to `cwd`

  -q, --quiet           do not log messages other than errors

  -w, --workspace=path  [default: ~/xod] use the workspace specified, defaults to $HOME/xod

  --debug               enable debug traces

EXAMPLES
  Compile a program using the current patch as entry point
  $ xodc compile -b arduino:avr:uno

  Compile the patch `main` from the xodball project and save binaries in `bin/uno.hex`
  $ xodc compile -b arduino:arv:uno foo.xodball main -o bin/uno.hex
```

_See code: [src/commands/compile.js](https://github.com/xodio/xod/blob/master/packages/xod-cli/src/commands/compile.js)_

## `xodc help [COMMAND]`

display help for xodc

```
USAGE
  $ xodc help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.1.4/src/commands/help.ts)_

## `xodc install:arch [fqbn]`

install toolchains

```
USAGE
  $ xodc install:arch [fqbn]

ARGUMENTS
  FQBN  Board FQBN. `arduino:sam` for example. See `xodc boards` list for the full list.

OPTIONS
  -V, --version         show CLI version
  -h, --help            show CLI help
  -q, --quiet           do not log messages other than errors
  -w, --workspace=path  [default: ~/xod] use the workspace specified, defaults to $HOME/xod
```

_See code: [src/commands/install/arch.js](https://github.com/xodio/xod/blob/master/packages/xod-cli/src/commands/install/arch.js)_

## `xodc publish [options] [project]`

publish a library

```
USAGE
  $ xodc publish [options] [project]

ARGUMENTS
  PROJECT
      Project to operate on. The project should point to a file or directory
      on file system. If omitted, it is inferred from the current working
      directory. Examples:

         * ./path/to/proj.xodball           # xodball
         * ./path/to/proj                   # just full path to a project

OPTIONS
  -V, --version         show CLI version
  -h, --help            show CLI help
  -q, --quiet           do not log messages other than errors
  -w, --workspace=path  [default: ~/xod] use the workspace specified, defaults to $HOME/xod
  --api=hostname        [default: xod.io] XOD API hostname
  --on-behalf=username  publish on behalf of the username
  --password=password   XOD API password
  --username=username   XOD API username

EXAMPLES
  Publish the current project with the version defined in `project.xod`
  $ xodc publish

  Publish a project saved as xodball
  $ xodc publish foo.xodball
```

_See code: [src/commands/publish.js](https://github.com/xodio/xod/blob/master/packages/xod-cli/src/commands/publish.js)_

## `xodc resave [options] [project]`

opens a project and saves it in another location or format

```
USAGE
  $ xodc resave [options] [project]

ARGUMENTS
  PROJECT
      Project to operate on. The project should point to a file or directory
      on file system. If omitted, it is inferred from the current working
      directory. Examples:

         * ./path/to/proj.xodball           # xodball
         * ./path/to/proj                   # just full path to a project

OPTIONS
  -V, --version         show CLI version
  -h, --help            show CLI help
  -o, --output=path     xodball or multifile directory output path, defaults to stdout
  -q, --quiet           do not log messages other than errors
  -w, --workspace=path  [default: ~/xod] use the workspace specified, defaults to $HOME/xod

EXAMPLES
  Exports the current multifile project to a xodball
  $ xodc resave . -o ~/foo.xodball

  Outputs the current multifile project as a xodball to stdout
  $ xodc resave

  Resaves one xodball into another (useful for applying migrations)
  $ xodc resave foo.xodball -o bar.xodball

  Converts a xodball to a multifile project
  $ xodc resave foo.xodball -o /some/new/dir
```

_See code: [src/commands/resave.js](https://github.com/xodio/xod/blob/master/packages/xod-cli/src/commands/resave.js)_

## `xodc tabtest [options] [entrypoint]`

tabtest project

```
USAGE
  $ xodc tabtest [options] [entrypoint]

ARGUMENTS
  ENTRYPOINT
      Project and/or patch to operate on. The project should point to a file or
      directory on the file system. The patch may either point to file system or
      be a XOD patch path. If either is omitted, it is inferred from the current
      working directory or another argument. Examples:

         * ./path/to/proj.xodball main      # xodball + patch name
         * ./path/to/proj/main/patch.xodp   # just full path to a patch
         * main                             # a patch in the current project

OPTIONS
  -V, --version          show CLI version
  -h, --help             show CLI help
  -o, --output-dir=path  [default: /tmp/xod-tabtest] path to directory where to save tabtest data
  -q, --quiet            do not log messages other than errors
  -w, --workspace=path   [default: ~/xod] use the workspace specified, defaults to $HOME/xod
  --no-build             do not build

EXAMPLES
  Build tabtests for project in current working directory
  $ xodc tabtest

  Specify target directory and project, only generate tests
  $ xodc tabtest --no-build --output-dir=/tmp/xod-tabtest ./workspace/__lib__/xod/net
```

_See code: [src/commands/tabtest.js](https://github.com/xodio/xod/blob/master/packages/xod-cli/src/commands/tabtest.js)_

## `xodc transpile [options] [entrypoint]`

transpiles (generates C++) a XOD program

```
USAGE
  $ xodc transpile [options] [entrypoint]

ARGUMENTS
  ENTRYPOINT
      Project and/or patch to operate on. The project should point to a file or
      directory on the file system. The patch may either point to file system or
      be a XOD patch path. If either is omitted, it is inferred from the current
      working directory or another argument. Examples:

         * ./path/to/proj.xodball main      # xodball + patch name
         * ./path/to/proj/main/patch.xodp   # just full path to a patch
         * main                             # a patch in the current project

OPTIONS
  -V, --version         show CLI version
  -h, --help            show CLI help
  -o, --output=path     C++ output file path, default to stdout
  -q, --quiet           do not log messages other than errors
  -w, --workspace=path  [default: ~/xod] use the workspace specified, defaults to $HOME/xod
  --debug               enable debug traces

EXAMPLES
  Transpile a program using the cwd patch as entry point, print to stdout
  $ xodc transpile

  Transpile the current project with `main` patch as entry point, save the output in `x.cpp`
  $ xodc transpile main -o x.cpp

  Transpile a project in the xodball with `main` patch as entry point
  $ xodc transpile foo.xodball main
```

_See code: [src/commands/transpile.js](https://github.com/xodio/xod/blob/master/packages/xod-cli/src/commands/transpile.js)_

## `xodc upload [options] [entrypoint]`

uploads a XOD program to the board

```
USAGE
  $ xodc upload [options] [entrypoint]

ARGUMENTS
  ENTRYPOINT
      Project and/or patch to operate on. The project should point to a file or
      directory on the file system. The patch may either point to file system or
      be a XOD patch path. If either is omitted, it is inferred from the current
      working directory or another argument. Examples:

         * ./path/to/proj.xodball main      # xodball + patch name
         * ./path/to/proj/main/patch.xodp   # just full path to a patch
         * main                             # a patch in the current project

OPTIONS
  -V, --version         show CLI version
  -b, --board=fqbn      (required) target board identifier (see `xodc boards` output)
  -h, --help            show CLI help
  -p, --port=port       (required) port to use for upload
  -q, --quiet           do not log messages other than errors
  -w, --workspace=path  [default: ~/xod] use the workspace specified, defaults to $HOME/xod
  --debug               enable debug traces

EXAMPLE
  Compile a program using the current patch as entry point, upload to ttyACM1
  $ xodc upload -b arduino:avr:uno -p /dev/ttyACM1
```

_See code: [src/commands/upload.js](https://github.com/xodio/xod/blob/master/packages/xod-cli/src/commands/upload.js)_
<!-- commandsstop -->
