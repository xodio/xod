#!/bin/sh

export SHOT="$(dirname "$(readlink -f "$0")")/screenshot-xodball"
find . -iname "update-screenshots.sh" \
  -execdir sh -c 'pwd && ./update-screenshots.sh' \;