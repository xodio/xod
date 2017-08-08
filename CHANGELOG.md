# Change Log

All notable changes to this project will be documented in this file.  See
[standard-version](https://github.com/conventional-changelog/standard-version)
for commit guidelines.

## Not yet released

### Bug fixes

* Fix upload failure if a `xod/common-hardware/text-lcd-16x2` or `xod/common-hardware/servo`
  node is used. XOD IDE now carries vital Arduino libraries in the distro.

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
