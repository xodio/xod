---
title: Patch Nodes
---

Patch Nodes
===========

What you see in a tab of main work area is called a *patch*. In other
programming languages a XOD patch corresponds to a single source file or
module.

Until now you’ve created single-patch programs and the patch was given name
`main` automatically for you. Creating a whole project on a single patch would
become messy once number of nodes and links will pass some limit. In many cases
it is a good idea to split complex patches into several that are easier to
understand and change.

Furthermore, you can reuse a patch several times in your project with slightly
different parameters and in such way avoid nodes duplication.

The mechanism which lets you use one patches as nodes on other patches is
called *patch nodes*.

In this chapter we’re going to build simple watering station for two plants.
The idea is to water a plat if it’s soil became too dry and constantly show current
soil measurements on text LCD screen.

Single plant station on a single patch
--------------------------------------

To start lets build a device that will work with a single plant. We’ll use single
patch `main` as in previous chapters.

Create new project `water-station` and wire up your circuit:

![Single plant circuit](./single-plant.fz.png)

Now make a following patch to control the device:

![Single plant patch](./single-plant.patch.png)

Make sure to properly set port values for all hardware nodes.

You may noticed it is very similar to previously implemented smart light project.
All things we’ve changed is the sensor and the actuator. Moisture sensor replaced
the light sensor and the pump replaced the LED.

Upload the program to your board and test the device. Put the sensor into a glass
of water and take it out. See how the relay reacts. Observe the text shown on LCD.

Let’s improve the program a bit and add pretty formatting to the messages. So that
instead of `"0.42"` the LCD would show something like `"Cactus: 42%"`. We achieve
this by adding two nodes. First one `to-percent` would convert number from sensor
to a string like `"42%"`. Second one `concat` would concatenate a constant prefix
`"Cactus: "` with the percent string:

![Single plant patch with percents](./single-plant-percent.patch.png)

Extracting plant logic to a separate patch
------------------------------------------

So far, so good. Now consider we want to extend the device to handle two plants
at once. We have another sensor, yet another relay, and pump. What we want to
share is LCD. Each plant’s message should be shown on its own line.

The very staightforward way to do it would be duplicate most of nodes related to
reading data, comparing it and formatting the result. But it would quickly became
unmanagable and error prone. Changes in one place would always require mirroring
the changes in other places by hand.

Patch nodes to the rescue. What do we have in common between different plants and
what differs? The logic is common, but the name of the plant, its watering threshold
value differs. Ports used to connect the sensor and the relay differs too. So
these things should be provided as parameters to our patch.

What the patch could output to the outside world? It could be a status message
string and a pulse that denotes that update is completed.

Create new patch with File → New Patch and name it `plant`. Look at Project Browser
you’ll see that `plant` patch has appeared next to our `main`.

First of all we’re going to define its inputs and outputs. Expand
`xod/patch-nodes` in Project Browser and notice nodes with names like
`input-xxx` and `output-xxx`. They are called *terminals* and define patch
input and output pins. Place few inputs and outputs according to what we’ve
planned to parametrize:

![Plant patch terminals](./plant-terminals.patch.png)

Now give the terminal nodes informative labels so that we can remember which one means
what:

![Plant patch terminals with labels](./plant-terminals-labeled.patch.png)

Switch back to the `main` patch. And try to add two nodes of our newly created type
`plant`:

![Patch nodes](./single-plant-with-patch-nodes.patch.png)

We’re going to use these two nodes to manage plants and move existing logic to the
shared `plant` patch. Let’s do it.

<div class="ui segment">
<p><span class="ui ribbon label">XOD T0D0</span>
Currently there is no cut/copy/paste in XOD. Yes, that’s a pain. We’ll implement it
in future versions. If you would like to give the feature more priority we welcome you to
<a href="//forum.xod.io">share your opinion on our forum</a>.</p>
</div>

Here is final `main` patch:

![Main patch for two plants](./two-plants-main.patch.png)

And the `plant` patch:

![Plant patch](./plant.patch.png)

Wire up the circuit:

![Single plant circuit](./two-plants.fz.png)

Set parameters for your plants with Inspector. Then upload the program and see how
both plants are served simultaneously with a single patch.

What’s next
-----------

Our quick tutorial is almost completed. The last thing to learn is what you can do
to build arbitrary projects with arbitrary hardware.
See [Complex Projects](../complex-projects/) chapter to know more.
