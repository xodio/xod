#!/usr/bin/env bash

function update_cpp_fixture {
  node ./packages/xod-cli/bin/xodc.js transpile --output=${1}/__fixtures__/arduino.cpp ${1} @/main
}

update_cpp_fixture ./workspace/blink
update_cpp_fixture ./workspace/count-with-feedback-loops
update_cpp_fixture ./workspace/lcd-time
update_cpp_fixture ./workspace/two-button-switch
