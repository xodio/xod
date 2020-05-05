#!/bin/bash

set -e

echo "Testing size of fixtures compiled for AVR platform..."

SELF_DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )

WS_DIR="$SELF_DIR/../../../workspace"
BUILD_DIR="$SELF_DIR/../.pio-build"

AVR_SIZE=~/.platformio/packages/toolchain-atmelavr/bin/avr-size

mkdir -p $BUILD_DIR

test_size () {
  echo "$1..."

  platformio ci \
    --board=uno \
    --build-dir=$BUILD_DIR \
    --keep-build-dir \
    --project-option="lib_extra_dirs = $WS_DIR/__ardulib__" \
    --verbose \
    $WS_DIR/$1/__fixtures__/arduino.cpp \
    > /dev/null

  AVR_SIZE_OUTPUT=$($AVR_SIZE -d -C --mcu=atmega328p $BUILD_DIR/.pioenvs/uno/firmware.elf)
  EXPECTED_OUTPUT="\
AVR Memory Usage
----------------
Device: atmega328p

Program:$2
(.text + .data + .bootloader)

Data:$3
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
}

test_size "blink" "    1556 bytes (4.7% Full)" "         30 bytes (1.5% Full)"
test_size "big-patch" "   25568 bytes (78.0% Full)" "        965 bytes (47.1% Full)"
