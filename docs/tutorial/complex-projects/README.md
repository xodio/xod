---
title: Complex Projects
---

Complex Projects
================

In past chapters of the tutorial series you’ve used bare minimum of nodes to
build simple projects. But what if you need to create something more complex?

The principle of programming will stay the same although you would create
more patches and use more nodes.

Search for nodes
----------------

Before implementing your own nodes check if there is a ready to use node
that will solve your problem. Visit [library index](/libs/) to browse for
existing nodes.

Interfacing with hardware
-------------------------

If you want to use a sensor or an electronic module that you haven’t find
support for it’s quite possible that all you need for it is few standard
nodes like `analog-input` or `digital-output`.

Refer to the item documentation to understand how you can talk with the
hardware.

Write a native wrapper
----------------------

You can implement a new node not only with XOD, but with C++ as well.
In this case you can even wrap an existing native library to make it
available in XOD.

See implementation of `analog-input`, `digital-output`, `text-lcd-16x2`
as an example of how to do this.

Tell us what you need
---------------------

XOD ecosystem is poor since the project is very-very young. If you need
a node for something, [ask for it on our forum](//forum.xod.io). That
would help us to better prioritize our work.

Dive into details
-----------------

Read [User’s guide](/docs/#users-guide) to understand XOD better.
