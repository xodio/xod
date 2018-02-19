---
title: Working on Projects
---

# Working on Projects

A project in XOD groups multiple patches together and forms a single
storable/shareable entity.

Usually, you create a XOD project per a real-world project, whatever it means.
It could be a digital art installation for some upcoming event, a program to
teach students, or a throw-away experiment for one evening. One project may
target multiple physical devices if they are parts of a whole.

To be more precise, XOD places no technical restrictions on what a project
should contain or not contain. It is purely an organizational object.

## How to create a project

Starting a new project in XOD IDE is as simple as hitting “File → New Project”
in the main menu.

A new project starts with a single patch called `main`, which has no special
treatment. You can rename or delete it right away if you'd like to do so.

## Saving a project

XOD stores projects locally on your computer in a file or files. In that sense,
it is similar to numerous of other classic applications: You can save, save as,
open, move, copy, or delete your project files on your PC or across machines.

A subtle difference from other applications is that although XOD IDE can look
like a multi-document editor (you open patches in tabs), the save operation is
atomic and stores/updates every part of a project in a single shot. This
behavior is necessary to avoid node reference inconsistencies and support the
two possible storage flavors described below.

### Packed .xodball

The default option to store a project is saving it as a so-called xodball, a
format in which the whole project is dumped to a single file with the `.xodball`
extension.

Once you have a xodball, you can do with it the same things you would do with an
office document file: send it to someone via e-mail, put it in Dropbox to share
it with another PC, or duplicate it to make a quick backup.

<div class="ui segment note">
<span class="ui ribbon label">Pro</span>
Under the hood, a xodball is a prettily printed JSON document that
describes all patches, nodes, links, and other entities contained in the
project.
</div>

### Multifile projects

The multi-file mode could be more suitable for advanced xoders who want
fine-grained control over project files, effective collaboration, and version
control with a traditional VCS like Git.

To save a project in multiple files, select that option in the save dialog
(Windows, Linux) or omit the `.xodball` extension while saving (macOS).

Note that multi-file projects are only supported in the desktop version of IDE.
The browser-based version always works with xodballs due to a lack of system
permissions.

An example outline of a project with two patches saved in multiple files:

<table class="ui celled striped table">
  <thead>
    <tr>
      <th colspan="2">/path/to/project-directory</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>
        <i class="open folder icon"></i> dc-motors
      </td>
      <td>Folder for the patch</td>
    </tr>
    <tr>
      <td>
        <i class="icon"></i>
        <i class="file outline icon"></i>
        patch.xodp
      </td>
      <td>JSON describing the patch</td>
    </tr>
    <tr>
      <td>
        <i class="icon"></i>
        <i class="file outline icon"></i>
        README.md
      </td>
      <td>Detailed description for the node</td>
    </tr>
    <tr>
      <td>
        <i class="icon"></i>
        <i class="file outline icon"></i>
        wiring_motorz.png
      </td>
      <td>Arbitrary media file referred by README.md</td>
    </tr>
    <tr>
      <td>
        <i class="open folder icon"></i> servo
      </td>
      <td>Folder for another patch</td>
    </tr>
    <tr>
      <td>
        <i class="icon"></i>
        <i class="file outline icon"></i>
        patch.cpp
      </td>
      <td>C++ implementation for the patch node</td>
    </tr>
    <tr>
      <td>
        <i class="icon"></i>
        <i class="file outline icon"></i>
        patch.xodp
      </td>
      <td>JSON describing the patch</td>
    </tr>
    <tr>
      <td>
        <i class="file outline icon"></i> project.xod
      </td>
      <td>Project manifest: name, version, license, etc</td>
    </tr>
  </tbody>
</table>

## Opening a project

To open a project made by you or downloaded somewhere, hit “File → Open Project”
in XOD IDE and point it to the `.xodball` or `project.xod` file.

<div class="ui segment note">
<span class="ui ribbon label">Note</span>
You can also double-click the file in your OS file-browser. However, the
file associations are only set up when you install the desktop XOD IDE on macOS
or Windows system-wide (i.e., to <code>C:\Program Files\</code>).
</div>

Unlike many other development systems, when you open a project, XOD tries to
resolve any missing dependencies and inconsistencies. This means that to
continue a project made by anyone on any machine, it should be enough just to
open the project in IDE.

<div class="ui segment note">
<span class="ui ribbon label">T0D0</span>
In an ideal world, it should work as described. But XOD is not
complete yet and so has two flaws that you should eventually note.

* If a project is open and references a library that you haven't installed yet,
  you'll see red nodes, links, and dead reference cautions. It will switch back
  to normal after few seconds when XOD auto installs required libraries from the
  cloud.

* It could happen that a library that the project depends on has introduced some
  backward-incompatible changes recently, and you'll be left with some dead
  references. In that case, you'll have to
  [downgrade problem libraries](../using-libraries/#upgrading-and-downgrading)
  manually.
</div>
