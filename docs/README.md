---
title: XOD Documentation
---

<style>
/* Force linked headers to be black, not blue */
h2 a {
  color: black;
  text-decoration: underline;
}

h2.icon.header {
  padding: 1.5em 0 0.5em 0;
}

/* Style for tutorial/guide/reference icons */
.ui.icon.header img {
  width: 64px;
  opacity: 0.4;
}

#showcase-cards .card {
  width: 340px;
}

/* No space below a card image */
#showcase-cards .image {
  font-size: 0;
}

/* Keep all images the same size */
#showcase-cards .card img {
  width: 100%;
  height: 191px; /* Aspect ratio 16/9 for 340px width */
  object-fit: cover;
}
</style>

XOD Documentation
=================

<div class="ui three column doubling stackable horizontally padded grid">

<!------------------------ Tutorial ------------------------->
<div class="column">
<h2 class="ui icon header">
  <a href="./tutorial/">
    <img src="./__img__/tutorial.svg" />
  </a>
  <div class="content">
    <a href="./tutorial/">Tutorials</a>
  </div>
</h2>

<h3 class="ui header">Official</h3>

* [Get started](./tutorial/install/)
* [Full index](./tutorial/) (28 chapters)

<h3>For video lovers</h3>

<div class="ui relaxed list">
  {{#each tutvideos}}
    <div class="item">
      <img class="ui avatar image" src="{{ avatar }}">
      <div class="content">
        <a href="{{ url }}" target="_blank">{{ title }}</a>
        <!-- counter _blank underscore ↑ -->
        <div class="description">{{ description }}</div>
      </div>
    </div>
  {{/each}}
</div>

</div><!-- column -->

<!-------------------------- Guide -------------------------->
<div class="column">
<h2 class="ui icon header">
  <a href="./guide/">
    <img src="./__img__/guide.svg" />
  </a>
  <div class="content">
    <a href="./guide/">User Guide</a>
  </div>
</h2>

[Concepts](./guide/#concepts) — XOD language objects and processes
described in detail.

[Making your own nodes](./guide/#making-your-own-nodes) — the most
straightforward way to extend XOD and add support for new hardware.

[Case studies](./guide/#case-studies) — how-to’s for common scenarios.

[Projects and libraries](./guide/#projects-and-libraries) —
creating, managing, and sharing your works.

</div><!-- column -->

<!------------------------ Reference ------------------------>
<div class="column">
<h2 class="ui icon header">
  <a href="./reference">
    <img src="./__img__/reference.svg" />
  </a>
  <div class="content">
    <a href="./reference/">Reference</a>
  </div>
</h2>
<div><!-- A div to force the following list to be the first-child and suppress margins -->

* [Supported hardware](./reference/supported-hardware/) <i class="ui large green microchip icon"></i>
* [Mouse and keyboard shortcuts](./reference/shortcuts/)
* [C++ node API reference](./reference/node-cpp-api/)

</div>
<h3 class="ui header">Standard library nodes</h3>

* [`xod/core`](/libs/xod/core/)
* [`xod/common-hardware`](/libs/xod/common-hardware/)
* [`xod/units`](/libs/xod/units/)
* [`xod/bits`](/libs/xod/bits/)

</div><!-- column -->

</div><!-- grid -->

---

<h2 id="showcase" class="ui header">
  <div class="content">
    Showcase
    <div class="sub header">Complete devices done with XOD</div>
  </div>
</h2>

<div id="showcase-cards" class="ui cards">
  {{#each showcase}}
    <div class="card">
      <div class="image">
        <a href="{{ url }}" target="_blank"><img src="{{ image }}" /></a>
        <!-- counter _blank underscore ↑ -->
      </div>
      <div class="content">
        <a class="header" href="{{ url }}" target="_blank">{{ title }}</a>
        <!-- counter _blank underscore ↑ -->
        <div class="meta">{{{ description }}} by {{ author }}</div>
      </div>
    </div>
  {{/each}}
</div>

<h2 id="contributing" class="ui header"><a href="./contributing/">Contributing</a></h2>

Looking for the ways to improve the documentation, XOD language, or the
ecosystem? There are many opportunities and we’re happy to accept any help.
Read the summary in the [Contributor’s guide](./contributing/).
