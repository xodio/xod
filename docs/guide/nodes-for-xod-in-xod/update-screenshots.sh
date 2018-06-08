#!/usr/bin/env bash

$SHOT ./my-utils.step1.xodball main ./step1.patch.png 640

$SHOT ./my-utils.step2.xodball between ./step2.patch.png 640

$SHOT ./my-utils.step3.xodball between ./step3a.patch.png 640
$SHOT ./my-utils.step3.xodball main ./step3b.patch.png 320

$SHOT ./my-utils.step4.xodball between ./step4a.patch.png 640
$SHOT ./my-utils.step4.xodball main ./step4b.patch.png 320

$SHOT ./my-utils.step5.xodball between ./step5a.patch.png 640
$SHOT ./my-utils.step5.xodball main ./step5b.patch.png 320
