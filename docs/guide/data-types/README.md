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
you could map voltage to a value on a logarithmic scale, or you could interpet
the voltage as a series of 0’s and 1’s arriving at a predefined rate, and
then convert them into bytes by grouping them into sets of eight.

XOD has native support for various data types — no need to use any
tricks. For example, there are data types that hold arbitrary numbers or
text strings.

<div class="ui segment">
<span class="ui ribbon label">Pro Tip</span>
<p>You may know there are languages with static typing (C, C++, Java,
Haskell) and languages with dynamic typing (JS, Python, Ruby). A long flamewar
has been waged as to which is better.</p>

<p>XOD is in the static-typing camp, e.g. a pin can’t have a number value
now, and a text string value two seconds later. This lets the IDE protect you
from silly mistakes.</p>
</div>

As mentioned above, a data type is a characteristic of a pin. You can say
“Node FOO has output pin BAR of number type”. That means that the BAR pin
carries a number value in every FOO node. You can also say “Node FOO has
input pin QUX of boolean type”. That means the FOO node always expects 0 or 1
value connected to its QUX pin.

Importantly, XOD types are divided between *pulse types* and all other types,
which are collectively known as *value types*. Each type is described below.

Pulse type
----------

The pulse type is very special, because it doesn't actually carry any data on
its own. It is only used to indicate that something has just happened or that
something should happen right now.

Pulses are similar to clock or interrupt signals in digital electronics.
All we’re interested in is the *moments* when the signal rises to Vcc or
falls to ground. They don’t carry any additional useful information.

A pulse signal can tell us that we’ve got a new TCP packet from the network,
a button was pressed, or some time interval has passed. We would use a pulse
signal to trigger an SMS send command or adjust motor speed.

Pulse signals are quite often accompanied by other value types on neighboring
pins. The values describe the “what”, while the pulse describes the
“when”.

Pulses give life to your programs. Without them, your device won't do anything.
Read [Execution Model](../execution-model/) to understand this logic in detail.

Here is a short list of nodes you’ll use a lot in conjunction with pulses:

* [`boot`](/libs/xod/core/boot/)
* [`clock`](/libs/xod/core/clock/)
* [`gate`](/libs/xod/core/gate/)
* [`any`](/libs/xod/core/any/)

Boolean type
------------

Boolean values can be either *true* or *false*. Alternatively, you can think of
them as a choice between of one/zero, yes/no, on/off, high/low, or
enabled/disabled.

Logical values are ubiquitous. They are adequate to implement simple
digital sensors (is a button pressed or not?), control simple actuators (should
a relay close?), and carry the results of logical operations (is the
temperature greater than 25°?).

Here are short list of nodes you’ll use a lot working with logical values:

* [`and`](/libs/xod/core/and/)
* [`or`](/libs/xod/core/or/)
* [`not`](/libs/xod/core/not/)
* [`if-else`](/libs/xod/core/if-else/)

Number type
-----------

Numbers are everywhere. The number data type is used to transfer sensor
readings, set motor speeds, perform arithmetic computations and
comparisons, and so on.

Number values in XOD can be fractional numbers and positive and
negative infinity.

Precision and the range of representable values depend on the capabilities of
the target platform. In any event, the number type is enough to operate on
numbers with six significant digits in range ±10<sup>38</sup>.

<div class="ui segment">
<span class="ui ribbon label">Pro Tip</span>
The underlying format for number values is IEEE 754 floating point with
single or double precision. It depends on a target platform.
</div>

Here are some nodes you’ll use to work with numbers:

* [`add`](/libs/xod/core/add/)
* [`subtract`](/libs/xod/core/subtract/)
* [`multiply`](/libs/xod/core/multiply/)
* [`divide`](/libs/xod/core/divide/)
* [`equal`](/libs/xod/core/equal/)
* [`less`](/libs/xod/core/less/)
* [`greater`](/libs/xod/core/greater/)
* [`constrain`](/libs/xod/core/constrain/)
* [`map-range`](/libs/xod/core/map-range/)

### Unit ranges

Many nodes use numbers in the range from 0 to 1. This is convenient if the
value denotes some kind of percentage. For example, a potentiometer node
uses 0.0 to denote the leftmost washer position, 0.5 to denote the middle
position, and 1.0 to denote the rightmost position.

Another example is an LED node. 0.0 is used to turn it off, 0.33
to emit 33% brightness and 1.0 to turn on it at maximum brightness.

Some nodes use ranges from -1 to 1. For example, a motor node use -1 for
full backward, -0.2 for 20% backward, 0 to stop, and 1 to run full forward.

Unit ranges are convenient to use, but entirely unnecessary.
It’s up to a node's implementation to decide what to do if an input value
falls out of the range. A common behavior is to clamp the input to the desired
range.

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

<div class="ui segment">
<span class="ui red ribbon label">XOD T0D0</span>
The types described below are not yet implemented in XOD. For now, we'll just
describe how things <em>could</em> look in future. We invite you
to join the <a href="//forum.xod.io">discussion on our forum</a>. You could
affect our design decisions.
</div>

Integer type
------------

Although the number type is often enough to process numeric values,
sometimes it’s preferrable to work with an integer type.

Integers have no problems with precision loss, are processed faster, and
make much more sense for some purposes, such as as getting a substring from
a string at a particular index and of a particular length.

The integer type can represent integral values in the range of rougly ±2
billion.

<div class="ui segment">
<span class="ui ribbon label">Pro Tip</span>
The underlying type for integer values is a signed 32-bit integer.
</div>

Byte type
---------

Bytes are the fundamental building blocks of low-level computing. Many hardware
peripherals send or consume a sequence of bytes to interact with a controller.

In XOD, a byte is a distinct data type that is used to perform low-level
operations. It can’t be directly interchanged with other types. You’ll
use some conversion nodes to convert byte values to and from more useful types
such as:

Tuples
------

Tuples are simply groups of other values with a predefined order and size.

For example, `Tuple3 Number Number Number` could be used to denote a point in
3D-space. In that case, it would contain X in the first position, Y in second,
and Z in the third.

Or `Tuple2 Byte Integer` could be used to encode a message for a particular IC
chip.

<div class="ui segment">
<span class="ui ribbon label">Pro Tip</span>
If you’re familar with C or Arduino, think of tuples as structs whose
members are accessed by their index rather than by their name.
</div>

You can easily pack and unpack single values to and from tuples using the
following nodes:

Lists
-----

Lists are sequences of values of a particular type. Unlike tuples, their length
is not predefined: they can grow or shrink as the program runs. And they can
only contain values of a single type.

For example:
- `List Number` can represent a history of temperature readings
- `List Byte` might be a packet to send or receive from the network
- `List (Tuple Number Number Number)` could represent the trajectory of a
   robotic hand as a sequence of points in 3D-space.
- `List (List Number)` represents a dynamically-sized 2D-table of numbers.

Common operations on lists include:

Errors
------

Error is not an independent type per se. Instead, it augments other types with
special values to denote computational errors.

For example, dividing an integer by zero would result in error value
rather than integer value.Similarly, an attempt to get an element from
an empty list would result in another error value.

Error values are viral. Once a functional node gets an error value on one of
its inputs all it outputs get error values too.

There are few nodes that you would use to generate your own errors and handle
potential errors.

Casting rules
-------------

What should happen if a pin of one type is connected to a pin of another
type? Some combinations are forbidden and you’ll get an error if you try to
link such pins. Other combinations are valid, and values are *cast* from one
type to another.

It is often desirable to convert a signal value from one type to
another, i.e. to link a pin with one type to a pin of another type.

For some type pairs, this is possible without any intermediate conversion
nodes:

<table class="ui definition single line table">
  <thead>
    <tr>
      <th></th>
      <th>→ Boolean</th>
      <th>→ Number</th>
      <th>→ Integer</th>
      <th>→ Byte</th>
      <th>→ String</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Boolean →</td>
      <td></td>
      <td>false → 0.0,<br/>true → 1.0</td>
      <td>false → 0,<br/>true → 1</td>
      <td>false →<br/>0000 0000,<br/>true →<br/>0000 0001</td>
      <td>false →<br/>"false",<br/>true →<br/>"true"</td>
    </tr>
    <tr>
      <td>Number →</td>
      <td>0.0 → false,<br/>any other → true</td>
      <td></td>
      <td class="disabled">use nodes</td>
      <td class="disabled">use nodes</td>
      <td>3.14159 →<br/>"3.14"<br/>(two digits<br/>after decimal)</td>
    </tr>
    <tr>
      <td>Integer →</td>
      <td>0 → false,<br/>any other → true</td>
      <td>as is</td>
      <td></td>
      <td class="disabled">use nodes</td>
      <td>as is</td>
    </tr>
    <tr>
      <td>Byte →</td>
      <td>0000 0000 → false,<br/>any other → true</td>
      <td class="disabled">use nodes</td>
      <td class="disabled">use nodes</td>
      <td></td>
      <td>1010 1111 →<br/>"10101111"</td>
    </tr>
    <tr>
      <td>String →</td>
      <td class="disabled">use nodes</td>
      <td class="disabled">use nodes</td>
      <td class="disabled">use nodes</td>
      <td class="disabled">use nodes</td>
      <td></td>
    </tr>
  </tbody>
</table>

Other convertions can’t always be done unambigously and thus are not allowed.
Use additional nodes to make casting explicit in such cases:

* [`format-number`](/libs/xod/core/format-number/)
* [`to-percent`](/libs/xod/core/to-percent/)

### List lifting

There are times when we have an output of a particular type `T` and an
input of the corresponding list type `List T`. Or vice versa. Conceptually,
these are two very different types. However, XOD can make an implicit
cast to link them properly. This transformation is known as “lifting”.

If a value of type `T` is connected to an input of type `List T`, the
value is considered to be a single element list with that value in
the first position, i.e. `42` becomes `[42]`.

Conversely, if a value of type `List T` is connected to an input of type `T` in
a functional node, the node *maps* each element of the list and the resulting
value is a list type. For example, if `[-1, 2, 3, -4, -5]` were passed to an
[absolute](/libs/xod/core/absolute/) node, which usually operates on single
numbers, the result would be `[1, 2, 3, 4, 5]`.

If two lists are given as the two inputs of a functional node, the node
operates element-wise on the lists, i.e. given `[1, 2, 3]` for `X` and `[40,
50, 60]` for `Y`, the [add](/libs/xod/core/add/) node would output `[41, 52,
63]`.

If the lists differ in length, the lifting operation treats each of the lists
as if it was as short as the shortest list, i.e. given `[1, 2, 3, 4]` and `[40,
50]`, the “add” node would output `[41, 52]`.
