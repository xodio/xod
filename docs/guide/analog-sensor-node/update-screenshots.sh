#!/usr/bin/env bash

$SHOT ./sharp-irm.step1.xodball main ./step1.patch.png 620
$SHOT ./sharp-irm.step2.xodball gp2y0a02-range-meter ./step2a.patch.png 700
# ./step2b.gif — can't autogenerate
$SHOT ./sharp-irm.step3.xodball gp2y0a02-range-meter ./step3a.patch.png 780
$SHOT ./sharp-irm.step3.xodball main ./step3b.patch.png 240
