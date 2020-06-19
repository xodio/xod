#!/usr/bin/env bash
: "${XOD_ARDUINO_CLI:=/tmp/arduino-cli/arduino-cli}"
mkdir -p $(dirname $XOD_ARDUINO_CLI)

if [[ "$OSTYPE" == "linux-gnu" ]]; then
    URL="http://downloads.arduino.cc/PR/arduino-cli/arduino-cli-25-PR91-linux64.tar.bz2"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    URL="http://downloads.arduino.cc/PR/arduino-cli/arduino-cli-25-PR91-osx.zip"
else
    echo "Unknown OS!" && exit 1
fi

FILENAME="${URL##*/}"
curl -s --create-dirs -o "${HOME}/${FILENAME}" "$URL"
EXT="${FILENAME##*.}"
if [[ "$EXT" == "zip" ]]; then
    unzip "${HOME}/${FILENAME}" -d "${HOME}"
else
    tar xfv "${HOME}/${FILENAME}" -C "${HOME}"
fi
rm "${HOME}/${FILENAME}"
mv "${HOME}/${FILENAME:0:12}"* $XOD_ARDUINO_CLI
