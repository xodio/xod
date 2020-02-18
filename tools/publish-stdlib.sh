#!/usr/bin/env bash

set -e

: "${XOD_USERNAME:?Set XOD_USERNAME env variable}"
: "${XOD_PASSWORD:?Set XOD_PASSWORD env variable}"

for path_to_libs_group in ./workspace/__lib__/xod*; do
  username="$(basename -- $path_to_libs_group)"
  ls -d $path_to_libs_group/* | xargs -I {} yarn xodc publish --on-behalf=$username {}
done
