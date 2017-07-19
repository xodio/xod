# Change Log

All notable changes to this project will be documented in this file.  See
[standard-version](https://github.com/conventional-changelog/standard-version)
for commit guidelines.

## Not yet released

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
