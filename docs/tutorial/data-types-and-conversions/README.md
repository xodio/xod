---
title: Data Types and Conversions Between Them
---

Data Types and Conversions Between Them
=======================================

In previous tutorial chapters you’ve had a deal with pulses and logical values.
A pulse just denotes the fact something happened and logical values carry
either 0 or 1 value.

The later is called *boolean* data type and its values are called boolean values.
It’s just a matter of terminology, but boolean value which corresponds to
1/high/on/enable is called *true*, and 0/low/off/disable value is called *false*.

There are more types in XOD to express more than simple flow of boolean values.
Lets get familiar with them.

Number type
-----------

42, 3.14159, -2.7… All these are numbers. They can be used to describe values
like temperature, distance, angle, acceleration along an axis, and many more.

Let’s use few nodes that employ numbers. We are going to build a simple dimmer
with a potentiometer which would set LED brightness. First of all, we need a
circuit:

![Pot and LED circuit](./pot-led.fz.png)

We would like to control LED brightness, so make sure to connect the LED to a
port with PWM feature available. They are marked with tilda (~). And since the
potentiometer provides analog values its port should be capable of reading
analog signals. Ports marked A0 through A5 are good choise for that.

Then create new project with main menu: File → New Project. Name it
`pot-led-dimmer` or something like that. Add nodes and links to get a program
that looks like one below:

![Pot and LED patch](./pot-led.patch.png)

We use `pwm-output` from `xod/core` to provide PWM signal to our LED.
The `DUTY` input defines duty cycle. Value 0.0 denotes always-low signal
(LED is off), 0.33 is for 33% cycle (third of full brightness), 0.5 is for
50% brightness, etc up to 1.0 for always-high signal when LED is 100% on.

Make sure to set `PORT` input value to 3 with Inspector.

Next, we use `analog-input` from `xod/core` to read values from potentiometer.
Read values are available on its output `SIG` and take value 0.0 for one edge
point of potentiometer, 1.0 for another, and fractional values for anything
between them.

For `PORT` value of `analog-input` use value 14 which corresponds to pin A0
on the board.

<div class="ui segment">
<p>
<span class="ui ribbon label">XOD T0D0</span>
Currently ports are represented as simple numbers. So you can’t enter value
like `A0` directly. Just remember that A0 is 14 behind the scenes, A1 is 15,
A2 is 16, etc.
</p>

<p>This inconvenience will be fixed in future versions of XOD.</p>
</div>

We need some source of pulses that would kick `analog-input` to update readings.
Again, `clock` would help. Set its `IVAL` to 0.02 seconds. That would give us
50 Hertz refresh rate.

Now note that we have `SIG` output of our potentiometer linked to `DUTY` input
of our LED. They both operate on *number type* in range from 0.0 to 1.0, so no
conversions are necessary and we link them directly.

Finally, our program reads like this:

- On boot the clock is set up;
- Every 20 ms the clock kicks the analog input with potentiometer causing it
  to read value again;
- The value is feed to PWM output with LED causing it to update its brightness.

Upload the program to your board and checkout the result.

Compare to convert between numbers and booleans
-----------------------------------------------

Let’s modify our device a bit so that it would work as a smart light. It should
turn on when it’s too dark and turn off when it’s bright enough. For this we’re
going to replace the potentiometer with simple LDR-based voltage divider:

![LDR and LED circuit](./ldr-led.fz.png)

Now our A0 port provides number values which correspond to ambient light
brightness. We should define a threshold value and if the value is under it, the
LED should be on, otherwise it should be off. So we should map a number value to
a boolean value somehow.

A common way to do this is using comparison nodes `less`, `greater`, `equal` from
`xod/core`. Let’s do it:

![LDR and LED patch](./ldr-led.patch.png)

The `less` node compares two numbers on left hand side (`LHS`) and right hand side
(`RHS`) and outputs true iff `LHS` < `RHS`. Set `RHS` to a constant value using
Inspector. An exact value depends on characteristics of the resistors and desired
darkness threshold. You could experiment a bit with it. 0.5 could work fine as a
start value.

Upload the program. Make sure the LED is off when device starts. If not, adjust the
threshold value. Then cover the LDR with your hand to simulate darkness, the LED
should turn on.

Look at the program again. Notice that we don’t tell our LED to turn off if
some condition met, then turn off if another computation gave us some value.
Instead we hard-wire pins of our nodes making the behavior explicit and easy
to reason about. That’s what differentiates functional/reactive paradigm of XOD
from conventional programming like C.

String type
-----------

Now you are familiar with pulses, booleans, and numbers. XOD also provides string
type. Strings are used to represent pieces of textual data. They could represent
single or multiple lines, or they could even be empty.

`"Hello world!"` is a string, `""` is an empty string, `"0.42"` is a string too,
although it contains only numeric characters and looks like a number at a first sight.

Let’s improve our device to show the lightness level on LCD screen. Use any
widespread text LCD to build circuit like one below:

![LDR, LED, and LCD circuit](./ldr-led-lcd.fz.png)

Add `text-lcd-16x2` node from `xod/common-hardware`. And give it the value of
`analog-input` as an input for the first line (`L1`). Link output of the `less` node
to the `L2` input.

![LDR, LED, and LCD patch](./ldr-led-lcd.patch.png)

Now upload the program to the board. See how the data is displayed and updated as
you cover the sensor.

Note that `L1` and `L2` inputs of the LCD expect string type values. And we linked
number and boolean values to them. This is possible because automatic conversion
from any type to string is possible. Although the inverse isn’t true.

What’s next
-----------

If you’re going to build a project that is more complex than trivial, the program
created on a single pane would be too complicated. There is a mechanism in XOD that
allows you to easily create your own nodes from existing. Learn how to do it
in [Patch Nodes](../patch-nodes/) chapter.
