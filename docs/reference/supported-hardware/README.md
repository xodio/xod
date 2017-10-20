---
title: List of Supported Hardware
---

# List of Supported Hardware

* <span class="ui tiny horizontal label">Raw</span> — a raw component.
  Soldering/breadboard and supporting components would be required.
* <span class="ui tiny horizontal label">Brk</span> — a breakout board.
  Components are ready, requires only soldering wires or connectors.
* <span class="ui tiny horizontal label">Wear</span> — a module designed
  to be used in wearable electronics projects. Sewed to fabrics.
* <span class="ui tiny horizontal label">Mod</span> — a ready-to-use
  module that could be used out of the box without soldering.
* <span class="ui tiny horizontal label">Sh</span> — an Arduino shield
  board.

{{#each index}}
<h2>{{ section }}</h2>
<table class="ui fixed small table">
  <thead>
    <tr>
      <th>Part/Module/Vendor</th>
      <th>XOD Node</th>
      <th>Shopping Links</th>
    </tr>
  </thead>
  <tbody>
    {{#each parts}}
    <tr class="top aligned">
      <td>
        <h4 class="ui header">{{ part }}</h4>
        <div class="ui description">{{ kind }}</div>
        {{#if vendor}}
        <div class="ui description">by {{ vendor }}</div>
        {{/if}}
      </td>
      <td>
        <div class="ui list">
        {{#each nodes}}
          <div class="ui item"><a href="/libs/{{ this }}/">{{ breakAsUrl this }}</a></div>
        {{/each}}
        </div>
      </td>
      <td>
        <div class="ui list">
        {{#each shopping}}
          <div class="ui item"><a href="{{ url }}" target="_blank"
            >{{ shop }} {{ sku }} <span class="ui tiny horizontal label">{{ flavor }}</span></a></div>
        {{/each}}
        </div>
      </td>
    </tr>
    {{/each}}
  </tbody>
</table>
{{/each}}

<script>
(function() {
  const colors = {
    Raw: 'grey',
    Brk: 'yellow',
    Mod: 'olive',
    Wear: 'brown',
    Sh: 'olive'
  };
  document.querySelectorAll('.label').forEach(
    label => label.classList.add(colors[label.innerText])
  );
})();
</script>
