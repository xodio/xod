---
title: Data Types
---

Data Types
==========

In XOD, every pin has a data type. Data values are transfered along links
between nodes, allowing them to work together to a perform a job.

This is very much like integrated circuits’ signals in electronics, though
hardware signals are quite limited as to what data they can carry. They are
simply voltages with a value somewhere between zero volts and few volts.
Various tricks are used to express meaningful values like numbers. For example,
you can map voltage to a value on a logarithmic scale, or you can interpet
the voltage as a series of 0’s and 1’s arriving at a predefined rate, and
then convert them into bytes by grouping them into sets of eight.

XOD has native support for various data types — no need to use any tricks. For
example, there are data types that hold arbitrary numbers, bytes, logic values,
or text strings.

<div class="ui segment">
<span class="ui ribbon label">Pro Tip</span>

You might know there are languages with static typing (C, C++, Java,
Haskell) and languages with dynamic typing (JS, Python, Ruby). A long flamewar
has been waged as to which is better.

XOD is in the static-typing camp, that is a pin can’t have a number value
now, and a text string value two seconds later. This lets the IDE protect you
from silly mistakes.

</div>

As mentioned above, a data type is a characteristic of a pin. You can say “Node
`foo` has output pin `OUT` of number type”. That means that the `OUT` pin
carries a number value in every `foo` node. You can also say “Node `foo` has
input pin `IN1` of boolean type”. That means the `foo` node always expects True
or False value connected to its `IN1` pin.

Generally, you may link inputs and outputs of the same type only. However,
some pairs of different types are allowed to be linked too. A conversion rule
is applied, which is known as *casting*. To learn which types may be implicitly
cast to which, see the [Data types reference](/docs/reference/data-types/#casting-rules).

Number type
-----------

Numbers are everywhere. The number data type is used to transfer sensor
readings, set motor speeds, perform arithmetic computations and comparisons,
and so on.

Number values in XOD can be integer or fractional numbers, positive and
negative infinity, or a special NaN (not a number) value.

The number type has a limited precision with following characteristics:

- Integers in range ±16 millions are exactly represented
- Bigger integers in range 3×10<sup>38</sup> are rounded to a multiple of
  2/4/8/16, etc depending on how big they are
- Fractional numbers are exactly represented if have six or less significant
  digits in total
- Fractional numbers with more than six significant digits are represented with
  precision loss

<div class="ui segment">
<span class="ui ribbon label">Pro Tip</span>

The underlying format for number values is
[32-bit IEEE 754](https://en.wikipedia.org/wiki/Single-precision_floating-point_format)
floating point.

</div>

Here are some nodes you’ll use to work with numbers:

* [`add`](https://xod.io/libs/xod/core/add/)
* [`subtract`](https://xod.io/libs/xod/core/subtract/)
* [`multiply`](https://xod.io/libs/xod/core/multiply/)
* [`divide`](https://xod.io/libs/xod/core/divide/)
* [`equal`](https://xod.io/libs/xod/core/equal/)
* [`less`](https://xod.io/libs/xod/core/less/)
* [`greater`](https://xod.io/libs/xod/core/greater/)
* [`map`](https://xod.io/libs/xod/math/map/)
* [`clip`](https://xod.io/libs/xod/math/clip/)

### Unit ranges

Many nodes use numbers in the range from 0 to 1. This is convenient if the
value denotes some kind of percentage. For example, a potentiometer node
uses 0.0 to denote the leftmost washer position, 0.5 to denote the middle
position, and 1.0 to denote the rightmost position.

Another example is an LED node. 0.0 is used to turn it off, 0.33
to emit 33% brightness and 1.0 to turn on it at maximum brightness.

Some nodes use ranges from -1 to 1. For example, a motor node use -1 for
full backward, -0.2 for 20% backward, 0 to stop, and 1 to run full forward.

Unit ranges are convenient to use, but entirely conventional. It’s up to a
node’s implementation to decide what to do if an input value falls out of the
range. A common behavior is to clip the input to the desired range.

Boolean type
------------

Boolean values can be either *True* or *False*. Alternatively, you can think of
them as a choice between of one/zero, yes/no, on/off, high/low, or
enabled/disabled.

Logical values are ubiquitous. They are adequate to implement simple digital
sensors (is a button pressed or not?), control simple actuators (should a relay
close?), and carry the results of logical operations (is the temperature
greater than 25°?).

Here are short list of nodes you’ll use a lot working with logical values:

* [`and`](https://xod.io/libs/xod/core/and/)
* [`or`](https://xod.io/libs/xod/core/or/)
* [`not`](https://xod.io/libs/xod/core/not/)
* [`if-else`](https://xod.io/libs/xod/core/if-else/)

String type
-----------

Strings represent pieces of text like “Hello World!”.

Unlike some languages that give strings special treatment, XOD considers them
to be just a list of bytes. Thus it’s up to you to manage text encoding. You
can choose ASCII, UTF-8, or old-school CP-1252 for storage. The best choice
depends on the hardware modules and data transfer formats you work with.

Computers don’t actually like text, but humans do. You’ll use text to parse
high-level input like an SMS or tweet, and display values to humans, or send
them via some web-service.

Byte type
---------

Bytes are the fundamental building blocks of low-level computing. Many hardware
peripherals send or consume a sequence of bytes to interact with a controller.
Essentially a byte is a group of eight bits which are either 0 or 1.

In XOD, the byte is a distinct data type that is used to perform low-level
operations. It can’t be directly interchanged with numbers as it happens in C++.
You have to use explicit conversion nodes from the standard
[`xod/bits`](https://xod.io/libs/xod/bits/) library. It also provides other
bitwise operation nodes.

Port type
---------

The port type is used to denote physical ports on a board. For hystorical
reasons, the term “port” is used rather than “pin” to clearly distinguish the
pins of XOD nodes (software thing) and pins for wires (hardware thing).
You will see pins of the port type often when place nodes representing
physical pieces of hardware like LEDs and buttons.

Values of the port type look like `A0`, `A3`, `D3`, `D13`. For example,
`A3` describe the board port with the third analog channel on it which
is commonly printed on a board as is: “A3”. The `D3` value denotes the
third digital port which is commonly printed on a board as “D3” or just “3”.

Values of the port type must not change their values at runtime: they
should stay constant. In other words, your button must not physically jump from
`D2` to `D10` once the program started. Although the immutability is not currently
checked, it will be enforced future versions.

Pulse type
----------

The pulse type is special, because it doesn’t actually carry any data on its
own. It is only used to indicate that something has just happened or that
something should happen right now.

Pulses are similar to clock or interrupt signals in digital electronics where
all we’re interested in is the *moments* when the signal rises to Vcc or
falls to ground. They don’t carry any additional useful information.

A pulse signal can tell us that we’ve got a new TCP packet from the network,
an NFC card has been detected, or some time interval has elapsed. We use a
pulse signal to trigger an SMS send command or reset a counter.

Pulse signals are quite often accompanied by other value types on neighbor
pins. The values describe the “what”, while the pulse describes the “when”.

Here is a short list of nodes you’ll use a lot in conjunction with pulses:

* [`flip-flop`](https://xod.io/libs/xod/core/flip-flop/)
* [`clock`](https://xod.io/libs/xod/core/clock/)
* [`count`](https://xod.io/libs/xod/core/count/)
* [`branch`](https://xod.io/libs/xod/core/branch/)
* [`any`](https://xod.io/libs/xod/core/any/)

Custom types
------------

When built-in types are not enough to express some domain, you can add new
types to the XOD type system. Custom types can be composites of other types or
wrap C++ classes.

Consider custom type values like black boxes which cannot do anything on their
own. The author of a custom type will always put some nodes which operate on
such values to perform meaningful actions, query their data, and allow creating
or updating the values.

Read [Defining Custom Types](../custom-types/) to learn how to introduce your
own types.

Generic types
-------------

The generic types are not specific types on their own, but rather placeholders
that resolve to specific types when the program compiles. They have names `t1`,
`t2`, and `t3`.

The generic types are used when a node performs an operation on values and it
does not matter what the actual types are. For example,
[`if-else`](https://xod.io/libs/xod/core/if-else/) outputs either of input
values depending on condition. The condition is boolean, but the values and the
output are generic `t1` as the node work the same way regardless of the actual
type.

To learn more about generic types, see [Generic Nodes](../generics/)
