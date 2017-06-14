---
title: Linking Rules
---

Linking Rules
=============

To make behavior of XOD programs predictable there are some rules on how pins
can be linked.

Outputs and Inputs
------------------

You’re are not allowed to link two input pins, neither you’re allowed to link
two output pins. It doesn’t makes much sense.

A link should always connect an output and an input.

If you want to mirror values, just create multiple links from an output pin.

TODO: example

An output can have an arbitrary number of links and an input can have
no more than one incoming link.

Type Matching
-------------

If an input and an output has same [data type](/docs/guide/data-types/) they may be linked
as is.

However if they have different types they are only allowed to be linked if
[casting](/docs/guide/data-types/#casting-rules) between their type is possible.

Once you start linking pins having same type as the source are highlighted with
a vivid color and pins having a type for which casting possible are highlighted
with a dim color.

Following color code is used:

Type                                                         | Color
------------------------------------------------------------ | -----
<span class="ui purple circular empty label"></span> Pulse   | Purple
<span class="ui pink circular empty label"></span>   Boolean | Pink
<span class="ui green circular empty label"></span>  Number  | Green
<span class="ui circular empty label"></span>        Integer | TODO
<span class="ui yellow circular empty label"></span> Byte    | Yellow
<span class="ui circular empty label"></span>        List    | TODO
<span class="ui circular empty label"></span>        Tuple   | TODO
