#!/usr/bin/env bash

SRC=w5500-connect.xodball

$SHOT $SRC 10-ethernet-shield ./ethernet-shield.patch.png 300
$SHOT $SRC 20-lan-ip-output ./lan-ip-output.patch.png 450
