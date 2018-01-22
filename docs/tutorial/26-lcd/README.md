---
title: Showing Text on LCD
---

# #26. Showing Text on LCD

<div class="ui segment note">
<span class="ui ribbon label">Note</span>
This is a web-version of a tutorial chapter embedded right into the XOD IDE.
To get a better learning experience we recommend to install the
<a href="/downloads/">desktop IDE</a> or start the
<a href="/ide/">browser-based IDE</a>, and you’ll see the same tutorial there.
</div>

Brace yourself, because we are about to learn about the `text-lcd-16x2` node!
If you haven’t already guessed, this node is used to control 16x2 LCD screens.

Now, let’s concentrate on the two `constant-string` nodes. These nodes contain
and transmit data of type _string_. Yellow is used to indicate string type pins
and links. A string is just another name for a line of ordinary text. This
sentence is a string!

![Patch](./patch.png)

## Test circuit

<div class="ui segment note">
<span class="ui ribbon orange label">Warning</span>
Be careful, there are many connections so chances to make a mistake are high.
If you see no text, double check all connections and rotate the potentiometer
to adjust contrast.
</div>

![Circuit](./circuit.fz.png)

[↓ Download as a Fritzing project](./circuit.fzz)

## How-to

![Screencast](./screencast.gif)

You should now see “Hello world!” displayed on the screen. Cool? Try to
display your own message on the screen.

[Next lesson →](../27-lcd-data/)
