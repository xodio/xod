*****************
Program Structure
*****************

Instead of writing a program in a text editor you're drawing it in XOD IDE.
Underlying format of XOD programs is a set of JSON-files, but it doesn't
matter much for the end user. These files are not intended to be manipulated
directly and are used just to store and distribute projects.

Nodes
=====

.. figure:: images/structure/pow.*
   :align: right
   :figwidth: 20%

   An example of “pow” node that takes a power of input number and passes it
   further.

Any XOD program consists of nodes that interact with each other. Roughly you can
think of nodes as electronic components: ICs, LEDs, mechanical switches, etc.

Every node has a *type* that determines what the node can and will do in the
program. Some nodes represent hardware modules (thermometers,
accelerometers, relays, motors), other nodes represent logic and mathematical
transformations (sum, comparison, merge, filter); another are watches and
constants used to configure and control behavior.

Of course, you may have as many nodes of a particular type as necessary.

Many node types are built in XOD. Also, you can include third-party node types,
create your own and share them with the community.

Nodes are presented as rectangles with a label. You can overwrite default label
with your own for clarity. It doesn't change a logic anyhow. For example, it is
a good idea to label a node “Water Pump” instead of default “Relay” if you have
a pump connected to the relay. After all, you’re trying to control a pump, not an
abstract relay.

Pins, Inputs, and Outputs
=========================

Every node has pins. They are depicted by small circles along edges of a node.
Rougly if a node is analogous to IC, its pins are IC’s legs.

The pin can be either input or output. Input pins are always on top and
outputs are at the bottom.

Think of inputs as data receivers and outputs are data senders or data sources.
Give something on node’s input and it’ll get triggered to process the data, make
something useful and possibly produce some output as a reaction. The reactive
programming concept in action.

Some pins have labels. They are only for visual differentiation and consist
of few letters that are mnemonics for pin function. Some mnemonics are widespread
like EN for “enable”, VAL for “value”, CK for “clock”. Other are node-specific
but anyway easy to remember. If there are just a few pins on the node and their
designation is unambigous it is OK to left labels out because it makes programs
more compact.

Every pin has a type on their own. The type denotes kind of data this pin was
designed to work with. There are few basic types: pulse, boolean, number,
string, array and a grouping mechanism that allows you create new composite
pin types. But more on that later.

Node Categories
===============

You may already noticed that nodes are colored differently. The color depends on
node type or rather on type *category*. There are few of them.

*Pure functional* nodes are gray. They react to input change instantly.
Think that their outputs are hard-bound to inputs. They are functions in the
mathematical sense: change of an input parameter lead to re-computation of the
function and update of the output. Also, pure functional nodes cannot change
their outputs sporadically without input change. Pure function nodes are used
to perform mathematical and logical operations, data transformations,
filtering, and formatting.

*Hardware* nodes are purple. They represent physical peripheral devices such as
sensors or actuators. Their inputs are commands to perform something useful, and
their outputs are signals of something has happened in the real world.

*Configuration* nodes (or config nodes for short) are green. They serve a value
that passes as a signal at the very beginning of program execution. You would
usually use constants to tweak the system. You can change the value served either
from patch editor directly or via a GUI board.

*Watch* nodes are pink. They show you the last signal value they have received.
You would use them to debug the program and to gather system output. Watches
are available in patch editor and on GUI boards as well.

Links
=====

.. figure:: images/structure/knob-led.*
   :align: right
   :figwidth: 20%

   Program example where four nodes are linked together to produce anti-dimmer.
   Rotate the knob more to get LED shine dimmer.

Nodes alone can't make your program different. To do something new they should
be connected to work together. To be more precise you don’t connect nodes,
but you connect their input and output pins. These connections are called *links*.
Rougly links are analogous to wires or traces in an electrical circuit.

Once there is a link between an output and an input any data appearing on the
output will instantly flow into the input. Which in turn will lead to node
update and further cascade update of other nodes behind that node.

It is only allowed to link inputs with outputs. You can’t connect output to
output for example. Also, an output can have an arbitrary number of outgoing links,
but an input can have at most one incoming link. There is a reason for this namely
explicit handling of simultaneous signals and conflict resolution. We’ll talk
about this in :ref:`execution` chapter.

Links can be drawn as straight lines or as polylines at your will. An appearance
doesn't affect logic anyhow. It’s just for program clearness.

Cycles and Buffers
==================

One thing to note is that links should not create cycles or loops within the
program. Thus, you will be not allowed to create a link that would create a
path that data can flow infinitely round after round.

However, there are cases when feeding a signal back is required. For these
cases there is a couple of special nodes that can be put in-between to
close the loop. But more on that later.

Patches
=======

A collection of nodes and links between them that are drawn together on single
canvas is called a *patch*. Patches a rough analog to files or modules in
classic programming.

In contrast to usual programming, however, there is no such thing as an entry point.
All patches of your program are equal in rights and execute in parallel.

You can give your patch input and output pins effectively turning it into
a new node type that you can place and use in your other patches and projects.

Schemes
=======

Schemes are a different kind of patches that describe your hardware wiring rather
than your program logic. They are static and just declare which things
connected where.

Nodes on schemes are required by those logical nodes that represent hardware so
that they’re able to convert data to real electrical signals and back when required.

Pins of hardware nodes has another type system as well. A pin can require or provide
*features*. Features denote supported hardware interfaces, electrical capabilities
of physical devices.

Again, there are hardware nodes built in and you can easily create your own or use
third-party nodes to communicate with potentially any piece of hardware in your
project.

Schemes are not restricted to a single target processor that will run the program.
They could include a definition of several distinct devices that work together for
one mission. For example, you can have a button directly linked to an LED on logical
patch but split them on hardware level to a pair of distinct devices: one with
button and one with LED connected by a 433 MHz channel or an Internet cloud service
accessed with Wi-Fi.

Once you look to a scheme of some XOD project, it should become obvious how to
wire electronic modules and components to replicate that device.

UI Boards
=========

TODO
