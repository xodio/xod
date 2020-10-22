#!/bin/bash

set -e

echo "Testing size of fixtures compiled for AVR platform..."

ARDUINO_CLI=${XOD_ARDUINO_CLI:-"arduino-cli"}

SELF_DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )

WS_DIR="$SELF_DIR/../../../workspace"

test_size () {
  echo "$1..."

  BUILD_DIR="/tmp/test-avr-size/$1"

  mkdir -p $BUILD_DIR
  cp $WS_DIR/$1/__fixtures__/arduino.cpp $BUILD_DIR/$1.ino

  SIZE_OUTPUT=$($ARDUINO_CLI compile --fqbn arduino:avr:uno --libraries $WS_DIR/__ardulib__ $BUILD_DIR)

  EXPECTED_OUTPUT="\
Sketch uses $2 of program storage space. Maximum is 32256 bytes.
Global variables use $3 of dynamic memory, leaving $4 bytes for local variables. Maximum is 2048 bytes."

  if [[ $SIZE_OUTPUT =~ "$EXPECTED_OUTPUT" ]]; then
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
    echo "$SIZE_OUTPUT"
    echo
    echo "If the size became better, fix expectation in"
    echo "packages/xod-arduino/tools/test-avr-size.sh script,"
    echo "and if the size became worse, fix C++"
    exit 1
  fi
}

test_size "blink" "1444 bytes (4%)" "25 bytes (1%)" "2023"
test_size "big-patch" "25456 bytes (78%)" "877 bytes (42%)" "1171"
