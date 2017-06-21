---
title: Data Types
---

Data Types
==========

In XOD any pin have a data type. Data values are transfered along links
between nodes allowing them to work together on a whole job.

This is very much like signals of ICs in electronics. Although signals in
hardware are quite limited in the sense what data they could carry. They are
simply voltage with a value somewhere between zero volts and few volts. To
express meaningful values like numbers various tricks are used.  For example,
one could map voltage to a value with a logarithmic scale, or consider the
voltage a series of 0’s and 1’s arriving at predefined rate, then group them by
eight and convert into bytes.

In XOD various data types are supported natively. There is no need to use the
tricks. For example, there are data types that hold arbitrary numbers or
textual strings.

<div class="ui segment">
<span class="ui ribbon label">Pro Tip</span>
<p>Perhaps you know, there are languages with static typing (C, C++, Java,
Haskell) and languages with dynamic typing (JS, Python, Ruby). What’s better
is a long flamewar.</p>

<p>XOD is in static typing camp. I.e. a pin can’t have a number value now, and a
textual string value two seconds latter. This gives necessary knowledge to IDE
so that it can protect you from silly mistakes.</p>
</div>

As said above, the data type is a characteristic of a pin. You can say “Node
FOO has output pin BAR of number type”. That means that the BAR pin
carries a number value at any particular node. You can also say “Node FOO has
input pin QUX of boolean type”. That means the FOO node always expects 0 or 1
value connected to its QUX pin.

One important division of types in XOD is between a *pulse type* and any other
type that are together called *value types*. All them described below.

Pulse type
----------

Pulse type is a very special type because it actually don’t carry any data on
its own. It is only used to tell about something happened just now or something
is required to happen right now.

Pulses are similar to clock or interrupt signals in digital electronics.
All we’re interested in is *moments* when the signal rises to Vcc or falls to
ground. They don’t carry any additional useful information in them.

A pulse signal can tell us that we’ve got a new TCP packet from network, that
a button was pressed, that some timeout has been past. We would use a pulse
signal to trigger SMS send or to adjust motor speed.

Very often pulse signals are accompanied with other value types on neighbour
pins. The values describe “what” whereas the pulse describes “when”.

Pulses make your programs live. Without them your device would stay intact.
Read [Execution Model](../execution-model/) to understand this logic in detail.

Here are short list of nodes you’ll use a lot working with pulses:

* [`boot`](/libs/xod/core/boot/)
* [`clock`](/libs/xod/core/clock/)
* [`gate`](/libs/xod/core/gate/)
* [`any`](/libs/xod/core/any/)

Boolean type
------------

Boolean value can be either *true* or *false*. You can also think of it as a
choice between of one/zero, yes/no, on/off, high/low, enabled/disabled.

Logical values are ubiquitous. They are enough to express values of simple
digital sensors (is a button pressed or not?), control simple actuators (should
a relay close?), and carry results of logical operations (is temperature
greater than 25°?).

Here are short list of nodes you’ll use a lot working with logical values:

* [`and`](/libs/xod/core/and/)
* [`or`](/libs/xod/core/or/)
* [`not`](/libs/xod/core/not/)
* [`if-else`](/libs/xod/core/if-else/)

Number type
-----------

Numbers are widespread. The numeric data type is used to transfer sensors’
measured values, set speed of motors, perform arithmetical computations,
comparisons and so on.

Number type values in XOD can represent fractional numbers, positive and
negative infinity.

Precision and most extremal representable values depend on capabilities of a
target platform. In any case it would be enough to operate on numbers with
six significant digits in range ±10<sup>38</sup>.

<div class="ui segment">
<span class="ui ribbon label">Pro Tip</span>
The underlying type for numerical values is IEEE 754 floating point with
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

Many nodes use numbers in range from 0 to 1. It is handy if the value denote
some kind of percentage. For example, a potentiometer node
uses 0.0 to denote leftmost washer position, 0.5 to denote middle position,
and 1.0 to express rightmost position.

Another example is an LED node. 0.0 is used to turn it off, 0.33
to emit 33% brightness and 1.0 to turn on at maximum brightness.

Some nodes use ranges from -1 to 1. E.g. motor node use -1 for
full backward, -0.2 for 20% backward, 0 to stop and 1 to run full forward.

Unit ranges are easy to operate with although they’re purely conventional.
It’s up to a node implementation to decide what to do if an input value falls
out of the range. Usually they’ll clamp the input to a desired range.

String type
-----------

Strings represent pieces of text like “Hello World!”.

Unlike some languages where strings are threated specially in XOD it’s just a
list of bytes. Thus it’s up to you to control text encoding. You can choose
ASCII, UTF-8 or old-school CP-1252 for storage. What would work best depends
on capabilities of hardware modules and data transfer formats you work with.

Computers don’t like text actually, but humans are. You’ll use text to parse a
high-level input like SMS or tweet and to present values back to human on
display or via some web-service.

<div class="ui segment">
<span class="ui red ribbon label">XOD T0D0</span>
All types described below are not yet implemented in XOD. For now, it’s just
a description of how things <em>could</em> look like in future. We’re welcome you
to the <a href="//forum.xod.io">discussion on our forum</a>. Here you can
affect the design decisions.
</div>

Integer type
------------

Although in many cases number type is enough to process numerical values,
sometimes it’s more preferrable to work on integer type.

It have no problems with precission loss, operated faster by processors and
have much more sense for some functions such as as getting a substring from
a string at a particular index and of a particular length.

Integer values can represent integral values from rougly ±2 milliards range.

<div class="ui segment">
<span class="ui ribbon label">Pro Tip</span>
The underlying type for integer values is a signed 32-bit integer.
</div>

Byte type
---------

Bytes are fundamental building blocks of low-level computing. Many hardware
peripherals send or consume series of bytes to interact with a controller.

In XOD byte is a distinct data type that is used to perform low-level
operations. It can’t be interchanged with other types directly. You’ll
use some conversion nodes to convert byte values to more useful types and
back. They are:

Tuples
------

Tuples are simply groups of other values with a predefined order and size.

Say, `Tuple3 Number Number Number` could be used to denote a point in 3D-space.
In that case it would contain X at first position, Y at second, and Z at
third.

Or `Tuple2 Byte Integer` could be used to describe a message for a particular
I²C chip.

<div class="ui segment">
<span class="ui ribbon label">Pro Tip</span>
If you’re familar with C or Arduino think of tuples as of structs in which
members are accessed by their index rather than by their name.
</div>

You can easily pack and unpack single values to or from tuples using following
nodes:

Lists
-----

Lists are sequences of values of a particular type. Unlike tuples their length
is not predefined: they could grow or shrink as program goes. And they can only
contain values of a single type.

For example:
- `List Number` can represent a history of temperature readings
- `List Byte` can be a packet to send or receive from the network
- `List (Tuple Number Number Number)` can represent a trajectory for a robotic
  hand as a sequence of points in 3D-space.
- `List (List Number)` represents a 2D-table of numbers with dynamic size.

Common operations on lists include:

Errors
------

Error is not an independent type per se. It rather augments other types with
special values to denote errors in computations.

For example, a division of an integer on zero would result in error value
rather than integer value. The same way an attempt to get an element from
an empty list would result in another error value.

Error values are viral. Once a functional node gets an error value on one of
its inputs all it outputs get error values too.

There are few nodes that you would use to generate your own errors and
to handle potentially error’ish values.

Casting rules
-------------

What should happen if a pin of one type is connected to a pin of another
type? Some combinations are forbidden and you’ll get an error if try to link
two pins of these types. Other combinations are valid and *casting* between two
is done behind the scenes.

In many cases you would like to convert a signal value from one type to
another. I.e. to link a pin with one type to a pin of another type.

For some type pairs this is possible without any intermediate conversion
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
      <td>3.14159 →<br/>"3.14"<br/>(two digits<br/>after dot)</td>
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

Other convertions can’t always be done unambigously thus are not allowed.
Use additional nodes to make casting explicit in such cases:

* [`format-number`](/libs/xod/core/format-number/)
* [`to-percent`](/libs/xod/core/to-percent/)

### List lifting

There are times when we have an output of a particular type `T` and an
input of corresponding list type `List T`. Or vice versa. Conceptually
these are two very different types. However, XOD can make an implicit
cast to link them properly. This transformation is known as “lifting”.

If a value of type `T` is connected to an input of type `List T`, the
value is considered to be a single element list with that value on
first position. E.g. `42` becomes `[42]`.

Vice versa, if a value of type `List T` is connected to an input of type `T` in
of a functional node that node *maps* each element of the list and its result
value gets list type. E.g. a node [absolute](/libs/xod/core/absolute/) that is
usually operate on single numbers given a list `[-1, 2, 3, -4, -5]` would have
`[1, 2, 3, 4, 5]` as a result.

If two lists given as values of two inputs of a functional node the computation
is done element-wise. E.g. a node [add](/libs/xod/core/add/) given `[1, 2, 3]`
for `X` and `[40, 50, 60]`
for `Y` would output `[41, 52, 63]`.

When lists’ length differ lifting operation takes a shortest one and acts as
all lists have the same shortest length. E.g. “add” node  given `[1, 2, 3, 4]`
and `[40, 50]` would output `[41, 52]`.
