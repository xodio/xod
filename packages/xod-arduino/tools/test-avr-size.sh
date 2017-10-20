#!/bin/bash

set -e

echo "Testing size of fixtures compiled for AVR platform..."

SELF_DIR=`dirname $0`

WS_DIR="$SELF_DIR/../../../workspace"
BUILD_DIR="$SELF_DIR/../.pio-build"

AVR_SIZE=~/.platformio/packages/toolchain-atmelavr/bin/avr-size

mkdir -p $BUILD_DIR
platformio ci \
  --board=uno \
  --build-dir=$BUILD_DIR \
  --keep-build-dir \
  $WS_DIR/blink/__fixtures__/arduino.cpp \
  > /dev/null

AVR_SIZE_OUTPUT=$($AVR_SIZE -d -C --mcu=atmega328p $BUILD_DIR/.pioenvs/uno/firmware.elf)
EXPECTED_OUTPUT="\
AVR Memory Usage
----------------
Device: atmega328p

Program:    2752 bytes (8.4% Full)
(.text + .data + .bootloader)

Data:         64 bytes (3.1% Full)
(.data + .bss + .noinit)"

if [[ $AVR_SIZE_OUTPUT =~ "$EXPECTED_OUTPUT" ]]; then
  echo "+ OK"
else
  echo "- FAIL"
  echo
  echo "Expected ====================================================="
  echo
  echo "$EXPECTED_OUTPUT"
  echo
  echo "Actual ======================================================="
  echo
  echo "$AVR_SIZE_OUTPUT"
  echo
  echo "If the size became better, fix expectation in"
  echo "packages/xod-arduino/tools/test-avr-size.sh script,"
  echo "and if the size became worse, fix C++"
  exit 1
fi
