---
title: Program Structure
---

Program Structure
=================

Programs in XOD are quite similar to electronic circuits. Whereas to build an
electronic circuit you use various electronic components and connect them
with wires, in a XOD program you use *nodes* and connect them with *links*.

![Example patch](./example.patch.png)

Nodes
-----

What a node does depends on its type. Like in reality there are ICs to control
motors, amplify audio signals, store data, in XOD there are many types of
nodes available. It is easy to create your own as well.

Some nodes represent physical devices like LED or digital thermometer, other
are used to transform and filter data. Here are few examples:

* [`thermometer-tmp36`](/libs/xod/common-hardware/thermometer-tmp36/)
* [`console-log`](/libs/xod/core/console-log/)
* [`add`](/libs/xod/core/add/)
* [`to-percent`](/libs/xod/core/to-percent/)

You place nodes you’ve chosen for your program into slots to be later connected
with links.

Pins, inputs, and outputs
-------------------------

Nodes alone are black boxes. To interact with them they expose *pins*. Think of
pins as of sockets, ports, IC legs, jack-connectors.

A pin can be either *input* or *output*. Once you feed an input with a new value
the node is evaluated. As a reaction it can update values of its output pins or
perform some interaction with real world, e.g. change a motor speed.

Some nodes send an output on their own as a reaction to some external event. For
example the [clock](/libs/xod/core/clock/) node sends output with regular time
intervals.

Pins are depicted as holes with short labels. Inputs are placed on a darker
background and outputs are placed on a lighter background.

![Nodes inputs and outputs](./nodes-inputs-outputs.png)

Links and values
----------------

Nodes talk to each other by transmitting values over *links*. A link is a
kind of wire that you use to connect one node output to another node input.

Values in XOD are quite similar to electric signals. However unlike their
electric counterparts they could carry not only a primitive voltage value, but
more sensible data like arbitrary numbers and text strings. Learn more about
values in [Data Types](../data-types/) article.

In digital electronics voltage values are switched discretely and their change
usually accompanied by some kind of clock signal. The clock signal is seen as
a sequence of “moments” which are defined by observing falling or rising signal
edges on the clock line. Interactions and changes actually happen at that
moments. I.e. a digital circuit is static until a new clock signal would
appear.

Behavior of values in XOD is very much similar. Values change and propogate
instantly. These cascade updates of values are called *transactions*. And things
that play a role of clock signals are called *pulses* in XOD.  [Execution
Model](../execution-model/) article describes all principles in detail.

There are few rules that define which pins are allowed to be linked and which
are not. They are intuitive enough, although for a formal description you can
see [Linking Rules](../linking-rules/).

Patches
-------

Nodes linked together form a *patch*. Patches are like modules, documents, files
in other systems.

You would have a single patch in a simple project and for complex projects you’d
likely to have many.

What makes a patch pretty interesting is that once you’ve created it you can
use it as a new type of node on other patches! That’s the main idea behind XOD
extensibility.

You use special *terminal nodes* to denote input and output pins when the patch
is used as a node.

<div class="ui segment">
  <span class="ui bottom attached label">
    Photo by <a href="https://www.flickr.com/photos/26735065@N00/">cutwithflourish</a>.
  </span>
  <p>
    <span class="ui blue ribbon label">Note</span>
    If you’ve heard of modular synthesizers they are very similar to XOD programs.
    The nodes are modules, the links are CV cables with banana connectors,
    the patches are rack chassis for modules.
  </p>
  <div class="ui fluid image">
    <img src="modular-synth.jpg" alt="Modular synth" />
  </div>
</div>
