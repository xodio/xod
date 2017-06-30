#!/usr/bin/env bash

set -ev

yarn run verify

if [ "$TRAVIS_OS_NAME" == "linux" ]; then
  # Run functional tests only on Linux since OSX currently fails to execute
  # `yarn electron-rebuild` successfully. The offending module is fsevents
  yarn run electron-rebuild;
  yarn run test-func;
fi

tags=$(git tag --points-at "$TRAVIS_COMMIT")
if [ -n "$tags" ]; then
    yarn run electron-dist
    config=$(mktemp)
    echo "$GOOGLE_CLOUD_STORAGE_CONFIG" | base64 --decode >"$config"
    while read -r tag; do
        node tools/extract-release-notes.js "${tag#v}"  \
            <CHANGELOG.md >packages/xod-client-electron/dist/RELEASE_NOTES.md
        find packages/xod-client-electron/dist -maxdepth 1 -type f \
            -exec node tools/electron-upload.js \
                --config="$config" --file={} --tag="$tag" \;
    done <<<"$tags"
fi
