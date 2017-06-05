#!/bin/bash

set -ex

DIR=test-cpp
RUNNER=$DIR/run-tests

g++ -g -O0 -o $RUNNER $DIR/test.cpp $DIR/list.cpp

if [[ $* == *--leak-check* ]]; then
    valgrind --leak-check=yes $RUNNER
else
    $RUNNER $@
fi
