# xod-tabtest

The package implements tabular test features for XOD patches. A patch may
include a `patch.test.tsv` spreadsheet file which defines several “input and
expected output” lines.

Using that data the package can generate a C++ test suite based on
[Catch2](https://github.com/catchorg/catch2/) framework which can be compiled
then with a regular GCC and run.

The package does not depend on any Node.js functionality, so may be consumed
from browser IDE, desktop IDE, or CLI.

## File structure

* `src/Tabtest_Js.re` defines public API for JavaScript consumers.
* `src/*.rei` define public API for ReasonML consumers.
