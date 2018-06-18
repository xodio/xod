#!/usr/bin/env bash

STARTING_DIR=$PWD
export SHOT="$PWD/tools/screenshot-xodball"

updaters=($(find ./docs/tutorial/ -iname update-screenshots.sh))
for updater in "${updaters[@]}"; do
  echo -n "$updater ..."
  cd $(dirname $updater)
  ./update-screenshots.sh
  cd "$STARTING_DIR"
  echo " done"
done
