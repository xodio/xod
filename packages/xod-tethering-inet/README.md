# XOD Tethering Internet

This package provides a text interface (AT commands) to interact with the internet. It receives AT commands, executes them and then sends back the result. So it makes possible to use the internet from the PC on the connected microcontroller via Serial.

The AT command protocol is based on the [ESP8266 specification in AT command mode](https://www.espressif.com/sites/default/files/documentation/4a-esp8266_at_instruction_set_en.pdf) with some assumptions. For example, some functions are not implemented, such as creating an access point or connecting to other Wi-Fi points. However, the package allows you to open and close TCP/UDP sockets, send data to them, and read from them. As well as doing DNS lookup, ping the host, get your local and remote IP address.
