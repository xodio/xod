---
title: Linking Rules
---

Linking Rules
=============

To make XOD programs behave predictably, there are some rules on how pins can
be linked.

Outputs and inputs
------------------

You’re are not allowed to link two input pins, nor are you allowed to link
two output pins. It doesn’t makes much sense.

A link must always connect an output and an input.

If you want to mirror values, just create multiple links from an output pin.

![Link fan out](./fan-out.patch.png)

An output can have an arbitrary number of links, but an input can have no more
than one incoming link.

Type matching
-------------

If an input and an output have the same [data type](../data-types/), they may
be linked as is.

However, if they have different types, they can only be linked if the output
type can be [cast](/docs/reference/data-types/#casting-rules) into the input type.

Once you start linking, pins that are suitable for the other end of the link
are highlighted.

Color code
----------

<span class="ui purple circular empty label"></span> Pulse<br/>
<span class="ui pink circular empty label"></span>   Boolean<br/>
<span class="ui green circular empty label"></span>  Number<br/>
<span class="ui yellow circular empty label"></span> String<br/>
