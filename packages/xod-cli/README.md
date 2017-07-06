# xod-cli

This package is a part of the [XOD](https://github.com/xodio/xod) project.

The package contains implemetation of `xodc` command line utility.

Basically it’s a collection of thin wrappers around NodeJS API’s available via
other packages. The responsibility of `xod-cli` is to parse command line
arguments, call API, and format the result on stdout/stderr properly.

`xodc` uses subcommands like `git` does to perform various functions.
The subcommands handling could be found in `src/xodc-*.js`.

## Usage

```
  xodc pack <projectDir> <output>
  xodc unpack <xodball> <workspace>
  xodc transpile [--output=<filename>] [--target=<target>] <input> <path>
  xodc publish --swagger=<swagger> --author=<author> [--orgname=<orgname>] [<projectDir>]
  xodc install --swagger=<swagger> <libUri> [<path>]
  xodc ab set-executable <path>
  xodc ab set-packages <path>
  xodc ab list-index
  xodc ab list-pavs
  xodc ab list-ports
  xodc ab list-boards <package> <architecture> <version>
  xodc ab install-pav <package> <architecture> <version>
  xodc ab compile <package> <architecture> <board> <file>
  xodc ab upload <package> <architecture> <board> <port> <file>
```
