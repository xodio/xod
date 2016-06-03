************
Introduction
************

XOD is a visual functional reactive programming language aimed to electronics
hobbyists.

It contrasts to classical programming like one do with C++ or JavaScript in
many ways although it is powerful enough to solve same problems.

Quick look
==========

.. image:: images/intro/example.*
   :align: center

The image is a climate control program example that strives to keep temperature in
71–77 °F range. It uses a digital thermometer as a sensor, a cooler, and a heater
as actuators, and an LCD to display current temperature.

As you can see XOD program is a diagram that describes what system
*should* be. Not a sequence of steps that would lead to the desired result.
Formally XOD is a data flow system rather than a control flow.

A processor running XOD program will evaluate the graph when required. So that
reality gets along with declared desire. That's it.

Rationale
=========

Programming is hard. Good programming is manifold hard. But it’s required to
create something new and *smart*.

Our intent is to create a shortcut. We found that many people feel more natural
if they think about a program as an electrical circuit or a mechanism rather than
as a sequence of instructions.

.. todo:: Example


Fundamental concepts
====================

Let's explain few concepts that stay behind programming in XOD:

* It's **visual**. In contrast to usual programming where behavior is described by
  text with some syntax rules, in XOD you describe the program with blocks and
  lines that connect them together. That blocks are called *nodes* and lines
  connecting them are called *links*. There are many nodes built in, there are
  nodes authored by other XODers, you can also create your own. 
* It's **functional**. Formally it means that no nodes share mutable state. If you
  don't understand what does it mean exactly, don't worry. It means that what you see
  is what you get, and it is impossible that a change of data in one part of
  the program would *implicitly* change another data in another part without an
  *explicit* link. This is how programming should look like in any language, but
  it is not, and such implicit dependencies are often lead to bugs, glitches,
  and crashes. XOD protects you from them.
* It's **reactive**. It means that nodes are activated and produce output signals
  as a reaction to input signals. Give an update in and you'll get an update
  out.

These three concepts together give you the ability to create robust programs 
in a simple way. Even if you haven't programming experience before.

What makes XOD different
========================

Some languages and tools that look similar to XOD at a first sight.
Notably Scratch_, `Lego Mindstorms`_, vvvv_, LabView_, NoFlo_.

.. _vvvv: https://vvvv.org/
.. _NoFlo: http://noflojs.org/
.. _Scratch: https://scratch.mit.edu/
.. _`Lego Mindstorms`: http://www.lego.com/en-us/mindstorms/learn-to-program
.. _LabView: http://www.ni.com/labview/

But neither of them share the same set of principles at once. Although some ideas
will look familiar if you have an experience with that products.

#. XOD is not a tool to build toy-only projects. It is scalable, reliable, and complete.
   You can use it for serious tasks.
#. XOD is targeted specifically toward electronics engineers making it easy to build
   gadgets, robotics, IoT.
#. XOD is visual in a first place. Visualization features are used primarily to give
   you an easy program structure overview and ability to quickly and intuitively change
   that program, not to make it look funny or coarse-grained.
#. XOD is open source. It’s free in sense of freedom. You can fork it, tweak it, host it
   and contribute back.
