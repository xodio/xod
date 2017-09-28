---
title: Upload to Arduino
---

# #02. Upload to Arduino

<div class="ui segment note">
<span class="ui ribbon label">Note</span>
This is a web-version of a tutorial chapter embedded right into the XOD IDE.
To get a better learning experience we recommend to
<a href="../install/">install the IDE</a>, launch it, and you’ll see the
same tutorial there.
</div>

Let's learn how to upload your patch with the node to Arduino! For an example
we’re going to use the `welcome-to-xod/02-deploy` patch. Although the process
is the same for any patch.

![Patch](./patch.png)

## Test circuit

![Circuit](./circuit.fz.png)

[↓ Download as a Fritzing project](./circuit.fzz)

## Instructions for the desktop IDE

1. Connect an Arduino to your computer.
2. Hit “Deploy → Upload to Arduino” from the main menu.
3. Select your board model and the port it is connected to, then click
   “Upload”.

![Upload to Arduino](./upload-desktop.gif)

## Instructions for the browser IDE

The browser version does not have permissions to access USB-ports. So you can’t
upload directly. However, you can use an existing Arduino IDE installation to
do this.

1. Assemble the circuit according to the picture above.
2. Generate Arduino source code of your first program. To do this, hit
   “Deploy → Show Code for Arduino”. Select all code and copy it to the
   clipboard.
3. Launch Arduino IDE and paste the code copied as is.
4. Select a proper port and board in the “Tools” menu.
5. Click the “Upload” button on the toolbar.

<div class="ui segment note">
<span class="ui ribbon label">Note</span>
If you’ve previously seen what code to blink an LED looks like for Arduino, you
might be astonished looking at the amount of code produced by XOD. Don’t worry
— most of it is code for the XOD runtime environment, which actually creates
little overhead after compilation. You don't need to understand how it
actually works. For now, think of it as a black box.
</div>

![Upload via Arduino IDE](./upload-web.gif)

<div class="ui segment note">
<span class="ui ribbon label">Feedback</span>
Have a problem with uploading? Please report it on our <a
href="//forum.xod.io">forum</a>. Describe what you're doing, what you expect to
get, and what you actually get. We will help.
</div>

[Next lesson →](../03-inspector)
