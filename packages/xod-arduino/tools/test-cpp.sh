#!/bin/bash

set -e

DIR=test-cpp
RUNNER=$DIR/run-tests

g++ \
  -I../../vendor/catch2 \
  -I../../cpplib/catch2utils \
  -std=c++11 \
  -g \
  -O0 \
  -o $RUNNER \
  $DIR/test.cpp \
  $DIR/list.cpp \
  $DIR/formatNumber.cpp

if [[ $* == *--leak-check* ]]; then
    valgrind --leak-check=yes $RUNNER
else
    $RUNNER $@
fi
