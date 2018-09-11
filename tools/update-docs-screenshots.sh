#!/bin/sh

SHOT="$(cd "$(dirname "$0")"; pwd)/screenshot-xodball"
export SHOT
find . -iname "update-screenshots.sh" \
  -execdir sh -c 'pwd && ./update-screenshots.sh' \;
