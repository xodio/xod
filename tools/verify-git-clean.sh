#!/usr/bin/env bash
set -e
DIFF_COUNT=$(git status --porcelain | wc -l)
if [[ "$DIFF_COUNT" != "0" ]]; then
    echo "Respository unexpected changes:"
    git status --short
    exit $DIFF_COUNT
fi
