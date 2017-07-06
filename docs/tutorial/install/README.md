---
title: Installing and Running XOD
---

Installing and Running XOD
==========================

To work with XOD, you use the XOD integrated development environment (IDE for
short), which comes in two flavors: browser-based and desktop version.

Browser-based IDE
-----------------

You can start the [browser-based XOD IDE](/ide/) simply by visiting the link.
However, because the browser has relatively few permissions to access the
computer’s file system and USB-ports, its capabilities are quite limited.

Notably, you can’t upload your program directly to the board from within your
browser and you won't get the convenient save/load functionality.

However, you can import/export your programs as a single file (known as a
xodball), generate source code that you could copy and paste into an Arduino
IDE, and then upload it to the board via the Arduino IDE.

Desktop IDE
-----------

XOD IDE for desktop requires installing, but provides all features. It works on
Windows, macOS, and Linux. Find a distribution package for your system on
[downloads page](/downloads/).

Upload your first program
-------------------------

Once you start XOD IDE, you’ll see the `welcome-to-xod` project open. It’s
a primitive demo project that—yes, you guessed it—blinks a LED on the board.

![XOD main window](./main-window.png)

Let's try to upload the program to your Arduino IDE.

In the main menu, go to Deploy → Show Code for Arduino. You’ll see much of
C++ source code that once compiled and uploaded to the board will blink the
built-in LED. If you have the Arduino IDE installed, try it. Copy and paste the
code to the Arduino IDE and click Upload.

<div class="ui segment">
<span class="ui ribbon label">Note</span>
If you’ve previously seen what code to blink an LED looks like for Arduino, you
might be astonished looking at the amount of code produced by XOD. Don’t worry
- most of it is code for the XOD runtime environment, which actually creates
little overhead after compilation. You don't need to understand how it
actually works. For now, think of it as a black box.
</div>

Upload directly from within the XOD IDE
---------------------------------------

This feature is only available in the desktop version. Go to Deploy → Upload
to Arduino. Select your board model and the serial port it is connected to:

![XOD model/port dialog](./board-selection.png)

Click Upload and wait.

Behind the scenes, XOD uses the Arduino IDE to compile and upload programs. So
if you have no Arduino IDE installed yet, you’ll be asked to download and
install it. The Arduino IDE itself has a package system to support various
boards. If a package supporting your board is not installed yet, it will also
be automatically installed.

If the upload succeeds, you’ll see 100% progress and a compiler message:

![XOD upload window](./upload.png)

<div class="ui segment">
<span class="ui ribbon label">Feedback</span>
If you have a problem with uploading, please report it on our <a
href="//forum.xod.io">forum</a>. Describe what you're doing, what you expect to
get, and what you actually get. We will help.
</div>

What’s next
-----------

Now that you can run the IDE and upload programs, let's try to understand how
and why they work. Go to the [Nodes and Links](../nodes-and-links/) chapter.
