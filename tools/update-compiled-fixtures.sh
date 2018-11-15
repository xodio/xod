#!/usr/bin/env bash

set -e

function update_fixture {
  echo ""
  echo "Building $3 from $2 for board $1..."
  echo ""

  BDIR=$(mktemp -d /tmp/xod-fixture-XXXXXX)
  platformio ci \
    --board $1 \
    --build-dir $BDIR \
    --keep-build-dir \
    ${2}/__fixtures__/arduino.cpp

  cp $BDIR/.pioenvs/${1}/${3} ${2}/__fixtures__
}

update_fixture uno ./workspace/blink firmware.hex
