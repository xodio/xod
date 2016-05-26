#!/bin/bash

PATCH=/tmp/xod-patch.js

make && \
targets/espruino/cli/compile-patch.js $1 $PATCH && \
espruino $PATCH
