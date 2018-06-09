#!/usr/bin/env bash

$SHOT ./time.xodball format-iso-example ./format-iso-example.patch.png 450
$SHOT ./time.xodball format-iso ./format-iso.patch.png 500
$SHOT ./time.xodball pack ./pack.patch.png 700
$SHOT ./time.xodball time ./time.patch.png 300
$SHOT ./time.xodball unpack-example ./unpack-example.patch.png 450
$SHOT ./time.xodball unpack ./unpack.patch.png 300
