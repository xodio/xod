---
title: Complex Projects
---

Complex Projects
================

In the tutorial's past chapters, you’ve used a bare minimum of nodes to build
simple projects. But what if you need to create something more complex?

The programming principles stay the same even if you create more patches and
use more nodes.

Search for nodes
----------------

Before implementing your own nodes, check if there is a ready to use node that
will solve your problem. Visit [library index](/libs/) to browse for existing
nodes.

Interfacing with hardware
-------------------------

If you want to use a sensor or an electronic module that you haven’t found
support for, it’s quite possible that all you need is a few standard nodes
like `analog-input` or `digital-output`.

Refer to the item's documentation to understand how you can talk with the
hardware.

Write a native wrapper
----------------------

You can implement new nodes not only in XOD, but also with C++.
You can even wrap an existing native library to make it available in XOD.

See the implementation of `analog-input`, `digital-output`, and `text-lcd-16x2`
for examples of how to do this.

Tell us what you need
---------------------

The XOD ecosystem is barebones since the project is very-very young. If you
need a node for something, [ask for it on our forum](//forum.xod.io). That will
help us better prioritize our work.

Dive into details
-----------------

Read the [User’s guide](/docs/#users-guide) to understand XOD better.
