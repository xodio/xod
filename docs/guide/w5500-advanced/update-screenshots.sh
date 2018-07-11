#!/usr/bin/env bash

SRC=w5500-connect.xodball

$SHOT $SRC 10-device ./device.patch.png 300
$SHOT $SRC 20-mac ./mac.patch.png 300
$SHOT $SRC 30-connect-dhcp ./connect-dhcp.patch.png 350
$SHOT $SRC 40-connect-out ./connect-out.patch.png 650
$SHOT $SRC 50-connect-static ./connect-static.patch.png 650
$SHOT $SRC 60-connect-static-ip ./connect-static-ip.patch.png 950
$SHOT $SRC internet ./internet.patch.png 750
$SHOT $SRC main ./main.patch.png 300
