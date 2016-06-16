Prerequisites
-------------

To build the documentation you should have few things installed:

  * Python 3.4+
  * [Sphinx](http://www.sphinx-doc.org/en/stable/install.html)
  * [Plant UML](http://plantuml.com/)
  * `make`

It is implied that you are in `/path/to/xod/doc` directory while executing
any command below:

    $ cd doc/

Virtual Environment
-------------------

Sphinx has few dependencies on its own, so you can prefer not to intall it
system-wide, but to sandbox within the project. To do this use `pyvenv` which
is a part of Python package:

    $ pyvenv _build/venv3
    $ . _build/venv3/bin/activate

If you’ve set up the sandbox Sphinx will install localy in `./_build/venv3`.

Sphinx Install
--------------

Run:

    $ pip install -r requirements.txt

Building HTML Documentation
---------------------------

Run:

    $ make html

You’ll get the result in `_build/html`.

If you get “make: sphinx-build: Command not found”, you have forgot to activate
the virtual environment for the current terminal session. Do:

    $ . _build/venv3/bin/activate
    $ make html
