# Install arduino-cli

Invoke-RestMethod -Uri "http://downloads.arduino.cc/PR/arduino-cli/arduino-cli-25-PR91-windows.zip" -Method GET -OutFile "$env:HOME/arduino-cli.zip"
unzip "$env:HOME/arduino-cli.zip" -d "$env:HOME"
mv "$env:HOME/arduino-cli-25-PR91-windows.exe" "$env:HOME/arduino-cli.exe"
copy "$env:HOME/arduino-cli.exe" "./packages/xod-client-electron/arduino-cli.exe"

$env:XOD_ARDUINO_CLI="$env:HOME/arduino-cli.exe"
