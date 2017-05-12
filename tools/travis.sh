#!/usr/bin/env bash

set -ev

yarn run verify

tags=$(git tag --points-at "$TRAVIS_COMMIT")
if [ -n "$tags" ]; then
    yarn run electron-dist
    config=$(mktemp)
    echo "$GOOGLE_CLOUD_STORAGE_CONFIG" | base64 --decode >"$config"
    while read -r tag; do
        find packages/xod-client-electron/dist -maxdepth 1 -type f \
            -exec node tools/electron-upload.js \
                --config="$config" --file={} --tag="$tag" \;
    done <<<"$tags"
fi
