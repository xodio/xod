---
title: Execution Model in Detail
---

Execution Model in Detail
=========================

In contrast to conventional programming, XOD is a data flow language rather
than a control flow language. That means there is no such thing as an
instruction pointer that determines what command will be executed at the next
moment. Instead, updates are done in semi-instantaneous *transactions* in which
all data is evaluated simultaneously.

Functional and effect nodes
---------------------------

There is such thing as a *function* in mathematics. You know many of them:

- `f(x) = sin x` is a unary (i.e. it takes a single argument) function that
  returns the sine of its argument;
- `f(r) = π × r²` is a unary function that returns the area of a
  circle with given radius;
- `f(x, y) = √(x² + y²)` is a binary function (i.e. it takes two arguments)
  that returns the distance from the origin to the point (x, y);
- `f(v₀, a, t) = v₀ × t + (a × t²) / 2` is a ternary (i.e. it takes
  three arguments) function that returns the velocity of an object at a
  particular moment in time.

Functions are great, because they behave very predictably, i.e. if you’re
computing the area of a circle, it will always be the same for the same radius.
It would be nonsense if the computation today differed from that of yesterday,
or if the result changed based on other factors like the weather outside.
Furthermore, computing the area of a circle with radius 2 can’t affect the
result of another computation, e.g. `sin 2`, now or in the future.

Functions are intuitive and understandable pieces that don’t have
computational side effects.

<div class="ui segment">
<p><span class="ui ribbon label">Note</span>
Experienced programmers say that such functions are referrentially transparent,
easy to reason about, stateless, idempotent, and pure.
</div>

The characteristics of functions make them ideal building blocks for creating
complex computations. The results of one function can be the input arguments of
another function, which could feed its results into yet another function, etc.

However, a program consisting solely from functions would always do the same
thing and produce exactly the same result. It would not depend on user input,
real world events, or time. It would not affect the external world or have the
ability to display computational results. All because functions can’t have
side effects. Thus another kind of building block is required.

In XOD, there are two kinds of nodes available. *Functional nodes* represent
functions. *Effect nodes* serve as interfaces to the external world, time, and
memory of past values.

### Functional nodes

Functional nodes always have inputs and output pins. All pins have [value
types](../data-types/#value). In other words functional nodes *never* have pins
of [pulse type](../data-types/#pulse).

Output values only depend on the values at input pins. They can’t depend on
time (unless given as an explicit input value), parameters of the external
outside world, or past computations. Given the same set of input values, they
always result in the same set of output values.

Some examples of functional nodes are:

* [`add`](/libs/xod/core/add/)
* [`if-else`](/libs/xod/core/if-else/)
* [`less`](/libs/xod/core/less/)
* [`or`](/libs/xod/core/or/)
* [`format-number`](/libs/xod/core/format-number/)

Functional nodes affect nothing but their output values. On their own, they
can’t change the brightness of an LED or the speed of a motor.

<div class="ui segment">
<p><span class="ui ribbon label">Note</span>
If you’re an advanced Excel user, think about functional nodes as cell
formulas.
</div>

### Effect nodes

Effect nodes can have just inputs, just outputs, or both. Their pins
are *always* the pulse type. Input pulses drive them to perform
effects, and output pulses tell us about effects that have taken place.

The result of activating an effect node can be arbitrary, e.g. turn on a lamp,
send an SMS, launch a nuke, or store a value for future use.

The node's implementation also decides when to emit an output pulse.
For example, a node could pulse when a sensor reading updates, an SMS is
received, or a timeout event occurs.

Some examples of effect nodes are:

* [`clock`](/libs/xod/core/clock/)
* [`delay`](/libs/xod/core/delay/)
* [`buffer`](/libs/xod/core/buffer/)
* [`analog-input`](/libs/xod/core/analog-input/)
* [`pwm-output`](/libs/xod/core/pwm-output/)

Effect nodes complement functional nodes so your program can interact with
users, the world, and time.

Program life cycle
------------------

At any particular moment, a XOD program is either in a transaction or in an
idle state.

While idle, the system remains stable, nothing changes. A board can even
choose to go to sleep to preserve the battery. Receiving a new pulse from an
effect node, e.g. a system clock or sensor, is what makes the program leave the
idle state.

A pulse causes the program to enter a new *transaction*. The pulse flows
downstream along links and causes the nodes it hits to update. The process of
updating a node is called *evaluation* in XOD.

At the moment a pulse is emitted, a node can (and in most cases does) set new
values on its other ouput pins with value types such as number or boolean.

Evaluation of a node hit by a pulse usually requires computing
actual values on another node’s input pins. The values on these pins could
depend on the values of upstream nodes’ outputs, which in turn depend on the
values of their upstream nodes, and so on. All these dependencies are resolved
by the XOD runtime engine. The final and intermediate values required to
evaluate a node are computed atomically in the transaction.

After all nodes affected by a pulse are evaluated the transaction is complete
and the system returns to the idle state.

Transaction rules
-----------------

### No external pulses while a transaction is in progress

All transaction prevent any external pulses from occuring while the current
transaction is in progress. Such a pulse would be postponed and trigger a new
transaction after the current transaction is complete.

To be more precise, external pulses are pushed into a FIFO queue. Once the
system is idle, a pulse is popped from the queue and a new transaction is
initiated. The transaction completes, the system goes idle, takes the next
pulse from the queue, launches a new transaction, etc. until the queue is
empty.

### Evaluation order

During a transaction, a node is evaluated only after all nodes
it depends on via links have been evaluated.

Consider the following example.

![Diamond graph](./abc.patch.png)

The result node will only be evaluated after both branches are evaluated,
despite the fact that they have node chains of different length. You can’t
know the order in which the branches will be evaluated. It could be M1-M2-M3,
M3-M1-M2, M1-M3-M2, or even M1-M2 and M3 in parallel. Furthermore, evaluation
of the result node might be postponed until its values are actually required
(so-called “lazy evaluation”). The target platform decides.

The only thing that does matter is that a node will be never evaluated with
incomplete data.

That is the reason why inputs can’t have more than one incoming link.
Otherwise, there would be ambiguity if two or more links tried to deliver
different values.

### Buffering

Effect nodes’ outputs are *buffered* when changed. In other words, the
outputs keep their most recent value. The data is persistent between
transactions. So a node will “see” the buffered value from an old
transaction via a link if the node must be evaluated again due to a change in
another input's value.

<div class="ui segment">
<span class="ui ribbon label">Pro Tip</span>
If you’re familiar with conventional programming, think of pins and their
buffered values as <em>variables</em>. They hold the program state and evolve
over time.
</div>

The target platform decides whether the values on functional nodes’ pins will
be buffered. Since a functional node's outputs depend only on its
inputs, the decision is just a matter of execution speed vs RAM consumption. It
has no effect on actual program behavior.

### Feedback loops handling

In XOD, link cycles that contain only functional nodes are not allowed. They
would lead to deadlocks and hangs.

However, cycles broken by effect nodes are OK. In this case, a new value will
be delivered via the feedback link, but the node will “see” it only once it has
received a new incoming pulse.

Summary
-------

The program's life cycle can be looked at as a infinite series of transactions
that run whenever an external impact occurs. Pulses drive the program. No
pulses, no changes.

Transactions are protected from sudden pulses that could change or make
ambiguous the order of node evaluation.
