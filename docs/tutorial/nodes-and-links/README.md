---
title: Nodes and Links
---

Nodes and Links
===============

Now let’s look closely at the demo project that opened up when you started
the IDE. It blinks the LED connected to pin 13 of your board. Many boards have
a built-in LED on that pin, but let’s make it more clear by building a simple
circuit:

![LED on pin 13](./led-on-pin-13.fz.png)

Make sure you’ve uploaded the program to the board and the LED actually
blinks.

Why does it blink?

The nodes
---------

You see three *nodes* linked together in a chain to implement the blinking.
Nodes are basic building blocks in XOD. Each of them handles a tiny portion of
work and communicates with other nodes.

![Blink patch](./blink.patch.png)

Let’s talk about each node one by one from bottom to top.

### digital-output

This node represents a single physical output pin on the board. It can be
either in a high (enabled) or low (disabled) state. We use it to switch our LED
on and off.

The node has two *inputs*. They are `PORT` and `SIG`.

The `PORT` defines what physical pin corresponds to the node. Select the node
by clicking on it. You’ll see the *Inspector* sidebar with the properties of
the selected node, i.e. our `digital-output`.

![Inspector](./inspector.png)

Note that the `PORT` value is set to 13th pin.

The value on the `SIG` input defines whether the digital output port should go
into a high or low state. In the Inspector, you see its value is disabled and
has the placeholder “linked”. That’s fine, because the value is defined
by a linked upstream node. More on that later.

### flip-flop

This node is like a virtual light switch that can be turned on (`SET`), turned
off (`RST`) or toggled (`TGL`).

In addition to its inputs, the `flip-flop` node has an *output*. It’s
`MEM`, which provides the current state: high or low.

### clock

The `clock` node emits a pulse on its `TICK` output at equal time intervals.
The interval is defined by the value of the `IVAL` input.

Select the `clock` node and note the value set for `IVAL` in Inspector.
The interval is expressed in seconds.

The second input, `RST` may be used to reset the clock.  We don’t need this
function in our program, so we don’t link it to anything.

The links
---------

You see that nodes' inputs and outputs are connected together with lines. These
lines are called *links* in XOD.

![Blink patch](./blink.patch.png)

They make it possible for nodes to talk to each other. Upstream nodes produce
values and downstream nodes consume that values.

What happens in our blink program? Take a look:

1. The `clock` node ticks at regular intervals
3. Each tick pulse goes to the `flip-flop` and toggles its state
4. The `flip-flop` provides its state value to the `digital-output`

As a result, we see the LED blinking.

Tweaking the program
--------------------

Try to change something.

Select the `clock` node and set a different `IVAL` value, e.g. 1.0 second,
upload the updated program and observe the result.

That’s not too interesting. Let’s add another LED. Improve your circuit:

![LED on pin 13 and 12](./led-on-pin-13-and-12.fz.png)

Place a new `digital-output` node. To do this, use the Project Browser sidebar.
The `digital-output` node is available in the `xod/core` library. Hover the
cursor over the item and click the (+).

![Project Browser](./project-browser.png)

You’ll see a new node appear in the main workspace. Drag it to the slot you
want. The one next to the existing `digital-output` would be fine. In
Inspector, set the `PORT` for the new node to 12, since it will control our new
LED.

Now we need to provide the new node with data. Link its `SIG` pin to the
`flip-flop` output:

![Blink two LEDs](./blink-two-leds.patch.png)

Upload the updated program to the board. Whoa! Both LED’s are blinking.

Now let’s improve our program some more and make the lights blink
alternately. To do this, we need to add a signal inversion into either of
links connecting the `flip-flop` and `digital-output`s.

The `not` node under `xod/core` does exactly that. Delete the existing link,
place a `not` node, and add new links so that the signal from our `flip-flop`
to the `digital-output` goes through it:

![Blink two LEDs with inversion](./blink-two-leds-inv.patch.png)

Upload the new version to the board. See the result?

Disjoint graphs and independent tasks
-------------------------------------

In XOD, nodes do not have to be connected in a single circuit. You can build
two or more disjoint clusters of nodes to perform several tasks simultaneously.

Try adding yet another LED with an absolutely independent blink interval and
state:

![Blink with disjoint clusters](./blink-disjoint.patch.png)

Now we have three `digital-output` nodes. It can be hard to understand which
node corresponds to each LED, so it would be better to give them clear labels.
To set a custom label for a node, select it and provide the label via
Inspector:

![Edit label with Inspector](./inspector-label.png)

You can provide a custom label for any node. Now the program looks clearer:

![Labeled nodes](./blink-disjoint-labeled.patch.png)

What’s next
-----------

You’ve seen pins and links that carry values of different types. Some provide
logical values (high or low) and some transmit pulses (ticks). They are
differentiated by colors.  XOD has even more data types. Go to the [Types and
Conversions](../data-types-and-conversions/) chapter to learn more on this
topic.
