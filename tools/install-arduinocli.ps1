# Install arduino-cli

Invoke-RestMethod -Uri "https://downloads.arduino.cc/arduino-cli/arduino-cli-0.3.1-alpha.preview-windows.zip" -Method GET -OutFile "$env:HOME/arduino-cli.zip"
unzip "$env:HOME/arduino-cli.zip" -d "$env:HOME"
mv "$env:HOME/arduino-cli-0.3.1-alpha.preview-windows.exe" "$env:HOME/arduino-cli.exe"
copy "$env:HOME/arduino-cli.exe" "./packages/xod-client-electron/arduino-cli.exe"

$env:XOD_ARDUINO_CLI="$env:HOME/arduino-cli.exe"
