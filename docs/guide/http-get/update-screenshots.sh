#!/usr/bin/env bash

SRC=get-ip.xodball

$SHOT $SRC 10-request ./request.patch.png 350
$SHOT $SRC 20-print-ip ./print-ip.patch.png 750
