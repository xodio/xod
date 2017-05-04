set -ev

npm run verify
if [ -z "$TRAVIS_TAG" ]; then
    npm run electron-dist
fi
