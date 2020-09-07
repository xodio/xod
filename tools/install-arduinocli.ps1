# Install arduino-cli

Invoke-RestMethod -Uri "https://github.com/arduino/arduino-cli/releases/download/0.12.0/arduino-cli_0.12.0_Windows_64bit.zip" -Method GET -OutFile "$env:HOME/arduino-cli.zip"
unzip "$env:HOME/arduino-cli.zip" -d "$env:HOME"
copy "$env:HOME/arduino-cli.exe" "./packages/xod-client-electron/arduino-cli.exe"

$env:XOD_ARDUINO_CLI="$env:HOME/arduino-cli.exe"
