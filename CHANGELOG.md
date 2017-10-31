# Change Log

All notable changes to this project will be documented in this file.  See
[standard-version](https://github.com/conventional-changelog/standard-version)
for commit guidelines.

## Not yet released

### Bug fixes

* [nodes] Fix regression. `xod/core/watch` compiles again.

<a name="0.15.0"></a>
## 0.15.0 (2017-10-31)

### Features and enhancements

* [core] Feedback loops! Previously, you could not upload a program containing
  graph cycles, in other words, your program’s “now” had no easy way to depend
  on the past. Now, you can place a special `defer` node in the way of a
  feedback link, and such program will be accepted. The `defer` nodes act as
  loop breakers to define execution priorities and escape points for potential
  dead-locks.
* [core] The standard node library (`xod/*`) is now tied to the distributive,
  not to a workspace. You’re no longer required to clear the workspace to get
  new version goodness.
* [core] Local libraries are now searched in `$workspace/__lib__` instead of
  `$workspace/lib`. It allows to have a project with name `lib` and makes the
  previous enhancement work for existing users.
* [ide] We’ve upgraded XOD build toolchain. Distributives lost in size from 25
  to 60% (depends on OS), the IDE now takes less time to start and eats less
  RAM.
* [ide] The IDE now warns about unsaved changes when a project is about to
  close. No more work loss.
* [ide] Double-click a node to drill down. That is a quicker way of browsing a
  program. The feature also works in the debug mode and lets you see watches
  of nested patches.
* [ide] Ctrl+A (⌘ A on macOS) selects all entities when the focus is on the
  patch board.
* [ide] Cloud compilation limit is shown explicitly now in the Upload dialog.
* [nodes] The [`delay` node](https://xod.io/libs/xod/core/delay) got an extra
  `ACT` output. It addresses many cases when you have had to use an extra
  `flip-flop` along with the `delay`.
* [nodes] The [`clock` node](https://xod.io/libs/xod/core/clock) got the `EN`
  input.  Now you can temporary disable a clock when necessary.
* [c++] BREAKING :exclamation: The way strings are represented in C++ changed
  significantly. Now they are more memory-efficient. Iteration interface is
  backward-compatible, but creation interface is not. An action can be required
  only if you make native (C++) nodes which operate on strings.
* [docs] Add [mouse and keyboard shortuts](https://xod.io/docs/reference/shortcuts/).
  Also available via “Help” menu in the IDE.
* [docs] Add [supported hardware reference](https://xod.io/docs/reference/supported-hardware/).

### New nodes

* [xod/core/defer-pulse](https://xod.io/libs/xod/core/defer-pulse)
* [xod/core/defer-boolean](https://xod.io/libs/xod/core/defer-boolean)
* [xod/core/defer-number](https://xod.io/libs/xod/core/defer-number)
* [xod/core/defer-string](https://xod.io/libs/xod/core/defer-string)
* [xod/core/gate-pulse](https://xod.io/libs/xod/core/gate-pulse)
* [xod/core/gate-boolean](https://xod.io/libs/xod/core/gate-boolean)
* [xod/core/gate-number](https://xod.io/libs/xod/core/gate-number)
* [xod/core/gate-string](https://xod.io/libs/xod/core/gate-string)
* [xod/core/if-else-string](https://xod.io/libs/xod/core/if-else-string)
* [xod/core/concat-3](https://xod.io/libs/xod/core/concat-3)
* [xod/core/concat-4](https://xod.io/libs/xod/core/concat-4)
* [xod/core/concat-5](https://xod.io/libs/xod/core/concat-5)
* [xod/core/concat-6](https://xod.io/libs/xod/core/concat-6)
* [xod/core/continuously-pausable](https://xod.io/libs/xod/core/continuously-pausable)

### Bug fixes

* [ide] You can scroll the Inspector if its contents are too tall. Now 13"
  laptop users should not be disappointed while editing a `text-lcd-16x2` node.
* [ide] If a project has integrity violations it no longer crashes an IDE. That
  could happen if a library your project depends on made some breaking changes,
  or if you made a mistake while editing `*.xodp` files manually. Now missing
  pins and patches are drawn in red giving you an opportunity to fix the
  project and go on.
* [ide] Fix a bug when an extra click was required to close the last tab.
* [ide] Fix a regression bug when deleting a patch lead to errors.
* [ide] Restore ESC behavior to cancel linking.
* [ide] Fix tab reordering behavior. Now it works the same way as you expect.
  Previously a dragged tab was swapped with the target tab instead of being
  inserted there.
* [ide] Fix crash on patch rename if the debugger is active.
* [ide] Ctrl+A (⌘ A on macOS) now work as expected on all text inputs where
  it did not before.
* [ide] The contents of dialogs is no longer selectable like it is a regular
  web-page.
* [core] Fix scenarios when values bound to inputs “leaked” to initial output
  values in C++. The simplest case to reproduce was to make a patch with
  `button` and `led` node. On boot, the LED should be turned off, but it was
  on.
* [c++] `isTimedOut(ctx)` now returns `false` if a node was not even scheduled
  with `setTimeout`.

<a name="0.14.0"></a>
## 0.14.0 (2017-10-04)

### Features and enhancements

* Brand new tutorial. It has two versions: the first one is embedded right into
  the `welcome-to-xod` project you see after the desktop IDE installation or
  browser-based IDE launch; the second one is published statically in the
  [documentation](https://xod.io/docs/) section of the site.
* The debugger and watches! Now, you can watch for value changes in real-time
  right inside the desktop XOD IDE. Place a `xod/core/watch` node, link it,
  and upload the program with “Debug after upload” checkbox set. The debugger
  also lets you view incoming serial data log like the Serial Monitor in
  Arduino IDE does.
* Bulk selection and mass actions. Hold the Ctrl key (Command on macOS) while
  clicking on nodes, links, or comments to select multiple entities. After
  that, you could move or delete them all at once.
* Cut/copy/paste. Finally, clipboard functionality you expect from any
  application is here. Ctrl+C/Ctrl+V your nodes on a patch, across patches, or
  even across XOD IDE windows.
* Cloud compilation. Now, rather than pull the whole compiler toolchain to your
  system, you can choose to compile in our cloud. Check “Compile in the cloud”
  box in the Upload Dialog to use it. This is the first step toward making the
  browser-based XOD IDE fully functional.

### New nodes

* [xod/core/clip](https://xod.io/libs/xod/core/clip)
* [xod/core/map-clip-range](https://xod.io/libs/xod/core/map-clip-range)
* [xod/common-hardware/pot](https://xod.io/libs/xod/common-hardware/port)

### Bug fixes

* Fixed upload dialog hang if the serial port was busy (thanks @awgrover)
* Fixed multiple recurring typos of “Ouput” with missing “t” (thanks @awgrover)
* Always keep patches sorted alphabetically in the Project Browser. Previously,
  new patches and patch renames broke the order.

<a name="0.13.0"></a>
## 0.13.0 (2017-09-04)

### Features and enhancements

* Switch patch board layout from slots to a slot/grid hybrid.
* Add nodes quick search. Hit Edit → Insert Node, or Double click the patch
  board, or press `I` key to invoke it.
* Add the Helpbar. The new pane that shows contextual help for a node. Hit View →
  Toggle Helpbar or press `H` key to show it.
* Implemented panning of the patch board. Now you can navigate large patches by
  pressing spacebar or middle mouse button and drag.
* The terminal nodes now have their own outstanding look (circles) so that you
  can quickly scan a patch to find its inputs and outputs.
* Now you can set starting values for `flip-flop`, `count`, and many other
  simply binding a desired initial value to their outputs.
* Add few missing tooltips for UI controls in the Inspector and Project
  Browser.
* Browser-based IDE now shows the direct download link for the desktop IDE when
  trying to upload.
* The Help main menu item now goes last in the desktop IDE as it should be.

### New nodes

* [xod/core/discretize-2](https://xod.io/libs/xod/core/discretize-2)
* [xod/core/discretize-3](https://xod.io/libs/xod/core/discretize-3)
* [xod/core/discretize-4](https://xod.io/libs/xod/core/discretize-4)
* [xod/core/nth-number-2](https://xod.io/libs/xod/core/nth-number-2)
* [xod/core/nth-number-3](https://xod.io/libs/xod/core/nth-number-3)
* [xod/core/nth-number-4](https://xod.io/libs/xod/core/nth-number-4)
* [xod/core/word-to-number](https://xod.io/libs/xod/core/word-to-number)
* [xod/core/i2c-begin-transmission](https://xod.io/libs/xod/core/i2c-begin-transmission)
* [xod/core/i2c-begin-transmission](https://xod.io/libs/xod/core/i2c-begin-transmission)
* [xod/core/i2c-end-transmission](https://xod.io/libs/xod/core/i2c-end-transmission)
* [xod/core/i2c-end-transmission](https://xod.io/libs/xod/core/i2c-end-transmission)
* [xod/core/i2c-read](https://xod.io/libs/xod/core/i2c-read)
* [xod/core/i2c-request-bytes-6](https://xod.io/libs/xod/core/i2c-request-bytes-6)
* [xod/core/i2c-request](https://xod.io/libs/xod/core/i2c-request)
* [xod/core/i2c-send-byte](https://xod.io/libs/xod/core/i2c-send-byte)
* [xod/core/i2c-send-bytes-2](https://xod.io/libs/xod/core/i2c-send-bytes-2)
* [xod/core/i2c-write](https://xod.io/libs/xod/core/i2c-write)
* [xod/common-hardware/adxl335-accelerometer](https://xod.io/libs/xod/common-hardware/adxl335-accelerometer)
* [xod/common-hardware/adxl335-convert](https://xod.io/libs/xod/common-hardware/adxl335-convert)
* [xod/common-hardware/l3g4200-gyro](https://xod.io/libs/xod/common-hardware/l3g4200-gyro)
* [xod/common-hardware/l3gd20h-gyro](https://xod.io/libs/xod/common-hardware/l3gd20h-gyro)
* [xod/common-hardware/lis331dlh-accelerometer](https://xod.io/libs/xod/common-hardware/lis331dlh-accelerometer)
* [xod/common-hardware/lis331hh-accelerometer](https://xod.io/libs/xod/common-hardware/lis331hh-accelerometer)
* [xod/common-hardware/lis3dh-accelerometer](https://xod.io/libs/xod/common-hardware/lis3dh-accelerometer)
* [xod/common-hardware/st-imu-generic-sensor](https://xod.io/libs/xod/common-hardware/st-imu-generic-sensor)
* [xod/common-hardware/st-imu-normalize-acc](https://xod.io/libs/xod/common-hardware/st-imu-normalize-acc)
* [xod/common-hardware/st-imu-normalize-va](https://xod.io/libs/xod/common-hardware/st-imu-normalize-va)
* [xod/common-hardware/st-imu-round-sensitivity](https://xod.io/libs/xod/common-hardware/st-imu-round-sensitivity)

### Bug fixes

* Fix upload on boards with multiple controller variants. Notably, Arduino Nano
  which has ATmega328 and ATmega168 versions.
* `xod/core/count` node now works fine with a fractional `STEP`’s.
* Fix compilation error saying “`dtostrf` is not defined” which occurred on
  non-AVR platforms when trying to cast a number to a string.
* Avoid false `xod/common-hardware/button` triggering on boot.
* Tweak buttons overlapping long node label for a selected item in the Project
  Browser.
* Double click on the add (+) button in the Project Browser no longer drops you
  to the clicked node implementation. You can still drill down if you’d click
  the label outside of a button.

### Optimizations

* Move most of the static data in generated C++ to flash memory section. It
  lowers RAM consumption at the order of 2× to 3×.
* Get rid of a separate `topology` mapping in C++. Now all node IDs are already
  sorted topologically. It saves one or two bytes of RAM and Flash per native
  node.
* Provide API for native nodes to access values stored in their outputs
  directly. It saves RAM for the nodes which keep their internal state, e.g.
  `flip-flop`, `count`, `fade`, etc.

### Deprecations and removals

* Rudimental support for JS-based platforms is dropped so that we can focus on
  C++ microcontroller platforms and support them well.

<a name="0.12.1"></a>
## 0.12.1 (2017-08-09)

### Bug fixes

* Fix upload failure if a `xod/common-hardware/text-lcd-16x2` or
  `xod/common-hardware/servo` node is used. XOD IDE now carries vital Arduino
  libraries in the distro.
* Improve UI responsiveness, fix IDE performance degradation over time. The
  problem was in a developer/debugging tool integrated to XOD IDE which is not
  very interesting for end-users. The tool is no longer enabled in public
  releases.
* Fix bound values propagation in complex scenarios with deeply nested patches.

<a name="0.12.0"></a>
## 0.12.0 (2017-08-07)

### Features and enhancements

* Implement in-patch comments. Now you can “Edit → Insert Comment” to place
  text note right onto the patch board. You will see an example of using
  comments in the `welcome-to-xod` project if you would create a new workspace
  (File → Select Workspace) or launch [browser-based IDE](https://xod.io/ide/).
* New build system no longer depends on Arduino IDE being installed. No more
  splash screen while uploading a XOD program to Arduino.
* Project `*.xodp` and `*.xod` files now don’t store fields with default values
  like `"description": ""` or `"comments": []`. This makes the files more
  compact and immune to insignificant diffs when they’re stored under VCS such
  as Git.

### New nodes

* [xod/common-hardware/dht11-thermometer](https://xod.io/libs/xod/common-hardware/dht11-thermometer/)
* [xod/common-hardware/h-bridge-dc-motor](https://xod.io/libs/xod/common-hardware/h-bridge-dc-motor/)
* [xod/common-hardware/button](https://xod.io/libs/xod/common-hardware/button/)
* [xod/common-hardware/led](https://xod.io/libs/xod/common-hardware/led/)
* [xod/common-hardware/hc-sr04-ultrasonic-range](https://xod.io/libs/xod/common-hardware/hc-sr04-ultrasonic-range/)
* [xod/common-hardware/hc-sr04-ultrasonic-time](https://xod.io/libs/xod/common-hardware/hc-sr04-ultrasonic-time/)
* [xod/common-hardware/gp2y0a02-range-meter](https://xod.io/libs/xod/common-hardware/gp2y0a02-range-meter/)
* [xod/common-hardware/gp2y0a21-range-meter](https://xod.io/libs/xod/common-hardware/gp2y0a21-range-meter/)
* [xod/common-hardware/gp2y0a41-range-meter](https://xod.io/libs/xod/common-hardware/gp2y0a41-range-meter/)
* [xod/common-hardware/gp2y0a-linearize](https://xod.io/libs/xod/common-hardware/gp2y0a-linearize/)
* [xod/units/c-to-f](https://xod.io/libs/xod/units/c-to-f/)
* [xod/units/deg-to-rad](https://xod.io/libs/xod/units/deg-to-rad/)
* [xod/units/rad-to-deg](https://xod.io/libs/xod/units/rad-to-deg/)
* [xod/units/m-to-cm](https://xod.io/libs/xod/units/m-to-cm/)
* [xod/units/m-to-ft](https://xod.io/libs/xod/units/m-to-ft/)
* [xod/units/m-to-in](https://xod.io/libs/xod/units/m-to-in/)
* [xod/units/m-to-mm](https://xod.io/libs/xod/units/m-to-mm/)
* [xod/core/debounce-boolean](https://xod.io/libs/xod/core/debounce-boolean/)
* [xod/core/select](https://xod.io/libs/xod/core/select/)
* [xod/core/count](https://xod.io/libs/xod/core/count/)
* [xod/core/fade](https://xod.io/libs/xod/core/fade/)
* [xod/core/pi](https://xod.io/libs/xod/core/pi/)
* [xod/core/pulse-on-change](https://xod.io/libs/xod/core/pulse-on-change/)
* [xod/core/pulse-on-false](https://xod.io/libs/xod/core/pulse-on-false/)
* [xod/core/pulse-on-true](https://xod.io/libs/xod/core/pulse-on-true/)
* [xod/core/square](https://xod.io/libs/xod/core/square/)
* [xod/core/cube](https://xod.io/libs/xod/core/cube/)
* [xod/core/pow](https://xod.io/libs/xod/core/pow/)
* [xod/core/sqrt](https://xod.io/libs/xod/core/sqrt/)
* [xod/core/cos](https://xod.io/libs/xod/core/cos/)
* [xod/core/sin](https://xod.io/libs/xod/core/sin/)
* [xod/core/tan](https://xod.io/libs/xod/core/tan/)
* [xod/core/acos](https://xod.io/libs/xod/core/acos/)
* [xod/core/asin](https://xod.io/libs/xod/core/asin/)
* [xod/core/atan](https://xod.io/libs/xod/core/atan/)

### Bug fixes

* **BREAKING**: Change pin naming scheme for native C++ nodes to avoid
  collisions with global macros. `Inputs::PORT` became `input_PORT`. As a
  consequence compilation for Arduino Zero, M0, MKR1000 is possible now.
  Workspaces with an older version of the standard library will no longer
  compile.
* Fix serial port enumeration when doing Deploy → Upload to Arduino (regression
  of v0.11.0).
* Fix overprotection of Inspector’s number input box from wrong values. It
  didn’t allow to enter negative numbers. Now they are valid as should be and
  scientific notation also works, i.e. one can enter 1e-6 for 0.000001.
* Program start no longer initiate a single pulse on every pulse link what
  could lead to an incorrect initial state of a device.
* Fix `text-lcd-16x2` didn’t clear the tail of a line which results in trash
  symbols when a new text was shorter than the previous.
* Fix few transpilation bugs in edge cases: values bound via Inspector did not
  propagate to nested patch nodes, multiple links from the same node to another
  node were mistakenly squashed.


<a name="0.11.0"></a>
## 0.11.0 (2017-07-24)

### Features and enhancements

* Remove pulse pins in most nodes. They now react to changes of input values
  immediately without any help of pulse signals. This slightly shifts XOD
  paradigm toward more simple and casual. Check out updated
  [tutorial](https://xod.io/docs/tutorial/) to see how the change simplified
  programs.
* Where pulses are still necessary they can be quickly bound with Inspector
  to a value “On boot” or “Continuously” without placing a new node with
  pulse source.
* Boolean outputs are now allowed to be linked to pulse inputs directly. A
  change of value from `false` to `true` is considered to be a single pulse.
* Patches now may include a long description with Markdown formatting and
  images.  The description would appear on patch documentation page at
  http://xod.io/libs/.
* Add patch properties to Inspector. It allows editing a patch description
  which once published would appear as a documentation string on
  http://xod.io/libs/.
* Add project preferences dialog to set description, license, authors. They
  would appear on http://xod.io/libs/ as well.
* Add “Help” item to the main menu with links to the documentation and forum.
* Sign distributives for Windows and macOS so that they no longer bark on you
  when you launch the installer.
* Implement desktop IDE auto-update. Now you don’t have to download and install
  a new version of XOD manually. Existing version will check for updates and
  suggest upgrading with a single click once a new version would be available.

### Bug fixes

* Fix silent error when trying to transpile a patch with patch nodes of 2+
  depth level. Now they work regardless of nesting level.
* Fix silent error when trying to transpile a program with loops (graph
  cycles). Now a clear error message is shown if there a loop is found.
* Fix Linux IDE failures on the first start. There were file permission
  problems which appeared as “Switch workspace directory” dialog appearing over
  and over again.
* Get rid of errors and warnings on start related to React in the developer
  console.

<a name="0.10.1"></a>
## 0.10.1 (2017-06-28)

### Bug fixes

* **Arduino**: Fix upload error when the latest version of Arduino IDE with the
  latest platform package installed in OS.

<a name="0.10.0"></a>
## 0.10.0 (2017-06-28)

Initial release
