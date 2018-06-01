---
title: Data Types Reference
---

Data Types Reference
====================

This reference briefly describes properties of built-in XOD types. To learn
about the types see [Data types guide](/docs/guide/data-types/).

## Casting rules

The following table shows *implicit* casts possible. That is, when a direct
link between two various data types is valid. Even if the direct link is
forbidden, there are nodes that help to convert between types explicitly.

<table class="ui definition single line table">
  <thead>
    <tr>
      <th></th>
      <th>→ Pulse</th>
      <th>→ Boolean</th>
      <th>→ Number</th>
      <th>→ Byte</th>
      <th>→ Port</th>
      <th>→ String</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Pulse →</td>
      <td></td>
      <td class="disabled">no</td>
      <td class="disabled">no</td>
      <td class="disabled">no</td>
      <td class="disabled">no</td>
      <td class="disabled">no</td>
    </tr>
    <tr>
      <td>Boolean →</td>
      <td>yes</td>
      <td></td>
      <td>yes</td>
      <td>yes</td>
      <td class="disabled">no</td>
      <td>yes</td>
    </tr>
    <tr>
      <td>Number →</td>
      <td class="disabled">no</td>
      <td>yes</td>
      <td></td>
      <td class="disabled">no</td>
      <td class="disabled">no</td>
      <td>yes</td>
    </tr>
    <tr>
      <td>Byte →</td>
      <td class="disabled">no</td>
      <td>yes</td>
      <td class="disabled">no</td>
      <td></td>
      <td class="disabled">no</td>
      <td>yes</td>
    </tr>
    <tr>
      <td>Port →</td>
      <td class="disabled">no</td>
      <td class="disabled">no</td>
      <td class="disabled">no</td>
      <td class="disabled">no</td>
      <td></td>
      <td class="disabled">no</td>
    </tr>
    <tr>
      <td>String →</td>
      <td class="disabled">no</td>
      <td class="disabled">no</td>
      <td class="disabled">no</td>
      <td class="disabled">no</td>
      <td class="disabled">no</td>
      <td></td>
    </tr>
  </tbody>
</table>

Here are details on how the data is transformed exactly when an implicit cast takes place.

<table class="ui table">
  <thead>
    <tr>
      <th>From</th>
      <th>To</th>
      <th>How</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Boolean</td>
      <td>Pulse</td>
      <td>
          Rising edge is considered to be a pulse. That is when the value was
          <code>False</code> and just became <code>True</code> a single pulse
          is emitted.
      </td>
    </tr>
    <tr>
      <td>Boolean</td>
      <td>Number</td>
      <td>
          <code>False</code> converts to <code>0.0</code> and<br/>
          <code>True</code> converts to <code>1.0</code>.
      </td>
    </tr>
    <tr>
      <td>Boolean</td>
      <td>Byte</td>
      <td>
        <code>False</code> converts to <code>0000 0000</code> and<br/>
        <code>True</code> converts to <code>0000 0001</code>.
      </td>
    </tr>
    <tr>
      <td>Boolean</td>
      <td>String</td>
      <td>
        <code>True</code> converts to <code>"true"</code> and<br/>
        <code>False</code> converts to <code>"false"</code>.
      </td>
    </tr>
    <tr>
      <td>Number</td>
      <td>Boolean</td>
      <td>
        Zero converts to <code>False</code>,<br/>
        any other value converts to <code>True</code>.
      </td>
    </tr>
    <tr>
      <td>Number</td>
      <td>String</td>
      <td>
          Converts with two digits after decimal, e.g.
          <code>3.14159</code> → <code>"3.14"</code> and
          <code>0</code> → <code>"0.00"</code>.
      </td>
    </tr>
    <tr>
      <td>Byte</td>
      <td>Boolean</td>
      <td>
        <code>0000 0000</code> converts to <code>False</code>,<br/>
        any other value converts to <code>True</code>.
      </td>
    </tr>
    <tr>
      <td>Byte</td>
      <td>String</td>
      <td>
        Converts as a two-digit hexadecimal number with h-suffix, e.g.
        <code>0000 1101</code> → <code>0Dh</code>.
      </td>
    </tr>
  </tbody>
</table>

## Literals

This section summarizes valid text input (i.e., grammar) for various data types.
It matters, for example, when you enter values in IDE with Inspector.

### Number literals


<table class="ui compact table">
  <thead>
    <tr>
      <th>Literal</th>
      <th>Comment</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="right aligned"><code>1000</code></td>
      <td>In the basic case of integer number, the literal is a sequence of decimal digits</td>
    </tr>
    <tr>
      <td class="right aligned"><code>+1000</code></td>
      <td>It may include an explicit sign</td>
    </tr>
    <tr>
      <td class="right aligned"><code>-1000</code></td>
      <td>Be negative</td>
    </tr>
    <tr>
      <td class="right aligned"><code>-1000.45</code></td>
      <td>Include a fraction after decimal dot</td>
    </tr>
    <tr>
      <td class="right aligned"><code>-.45</code></td>
      <td>If the integer part is zero it may be omitted</td>
    </tr>
    <tr>
      <td class="right aligned"><code>1000.</code></td>
      <td>Trailing decimal dot is allowed</td>
    </tr>
    <tr>
      <td class="right aligned"><code>2e6</code></td>
      <td>A literal can have a decimal exponent after “e” character (2×10<sup>6</sup> = 2 000 000)</td>
    </tr>
    <tr>
      <td class="right aligned"><code>2e+6</code></td>
      <td>The exponent can have a sign</td>
    </tr>
    <tr>
      <td class="right aligned"><code>2e-6</code></td>
      <td>An be negative (2×10<sup>-6</sup> = 0.000002)</td>
    </tr>
    <tr>
      <td class="right aligned"><code>+.2e-3</code></td>
      <td>Rules for the part before “e” still apply</td>
    </tr>
    <tr>
      <td class="right aligned"><code>Inf</code></td>
      <td>A special value to denote the positive infinity</td>
    </tr>
    <tr>
      <td class="right aligned"><code>+Inf</code></td>
      <td>Can include explicit sign</td>
    </tr>
    <tr>
      <td class="right aligned"><code>-Inf</code></td>
      <td>Or be a negative infinity</td>
    </tr>
    <tr>
      <td class="right aligned"><code>NaN</code></td>
      <td>The “Not A Number” value to signal about an operation error</td>
    </tr>
  </tbody>
</table>

### Boolean literals

Valid literals are:

- `True`
- `False`

In some inputs IDE or CLI can normalize almost valid literals like lower-cased
`true` or `false`, however the canonical form is as shown.

### Byte literals

<table class="ui compact table">
  <thead>
    <tr>
      <th>Literal</th>
      <th>Comment</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="right aligned"><code>1Ah</code></td>
      <td>The canonical hexadecimal form contains two digits (0-9|A-F) followed by h-suffix</td>
    </tr>
    <tr>
      <td class="right aligned"><code>03h</code></td>
      <td>Values less than 10h should have the leading zero</td>
    </tr>
    <tr>
      <td class="right aligned"><code>00011010b</code></td>
      <td>In the binary form the literal is eight digits (0|1) followed by b-suffix</td>
    </tr>
    <tr>
      <td class="right aligned"><code>26d</code></td>
      <td>The decimal form contains an integer in range [0; 255] followed by d-suffix</td>
    </tr>
    <tr>
      <td class="right aligned"><code>006d</code></td>
      <td>The leading zeros are allowed but may be omitted</td>
    </tr>
  </tbody>
</table>

In some inputs IDE or CLI can normalize almost valid literals like `3h` (no
leading zero), `0x03` (customary hexadecimal for C\++, JavaScript, and Python
programmers), `3` (implied decimal 3), however the canonical form is as shown.

### Port literals

<table class="ui compact table">
  <thead>
    <tr>
      <th>Literal</th>
      <th>Comment</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="right aligned"><code>D4</code></td>
      <td>Digital port values start with “D” followed by the actual port number</td>
    </tr>
    <tr>
      <td class="right aligned"><code>A6</code></td>
      <td>Analog ports/channels start with “A” followed by the number</td>
    </tr>
  </tbody>
</table>

Note that analog port values can be converted to digital port values, but not
vice versa.  So, in cases when an analog channel and a digital port share the
same physical board pin (e.g., A6 and D4 on Arduino Leonardo) you must choose
A6 for ADC reading, albeit for digital operations either will be suitable: `A6`
will be coerced to `D4` by the runtime engine.

### String literals

<table class="ui compact table">
  <thead>
    <tr>
      <th>Literal</th>
      <th>Comment</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>"Hello"</code></td>
      <td>String literals are allways enclosed in double quotes</td>
    </tr>
    <tr>
      <td class="single line"><code>"Dist: 10\""</code></td>
      <td>If a string contains <code>"</code> itself, it should be escaped by <code>\</code> (Dist: 10")</td>
    </tr>
    <tr>
      <td class="single line"><code>"Hello\nWorld"</code></td>
      <td>A new line is encoded as <code>\n</code> sequence</td>
    </tr>
    <tr>
      <td class="single line"><code>"Hello\r\nWorld"</code></td>
      <td><code>\r</code> encodes carriage return</td>
    </tr>
    <tr>
      <td class="single line"><code>"1023.0\t244\t1"</code></td>
      <td><code>\t</code> encodes TAB symbol</td>
    </tr>
    <tr>
      <td class="single line"><code>"A\\B\\C"</code></td>
      <td>Backslashes are escaped by backslashes (A\B\C)</td>
    </tr>
  </tbody>
</table>

### Pulse literals

<table class="ui compact table">
  <thead>
    <tr>
      <th>Literal</th>
      <th>Comment</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>Never</code></td>
      <td>Literally never emit a pulse there</td>
    </tr>
    <tr>
      <td><code>On Boot</code></td>
      <td>Emit a pulse once at the program start</td>
    </tr>
    <tr>
      <td><code>Continuously</code></td>
      <td>Emit pulses as fast as performance allows, in each transaction</td>
    </tr>
  </tbody>
</table>
