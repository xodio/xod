# Arduino libraries

The directory contains vendoring copies of some Arduino Libraries used in native nodes’ implementations.

* `LiquidCrystal` -- the standard library
* `LiquidCrystal_I2C` -- https://github.com/fdebrabander/Arduino-LiquidCrystal-I2C-library
* `SD` -- the standard library
* `Servo` -- the standard library
* `Ethernet2` -- https://github.com/xodio/Ethernet2 (modified https://github.com/adafruit/Ethernet2)
* `ESP8266UART` -- custom library. Should be published to the XOD GitHub repository along with the "UART" library, which is bundled into `xod-arduino/platform` and some `xod/uart` nodes.
* `WS2812_NoBuffer` -- custom library for WS2812 without buffer. Based on [SimpleNeopixelDemo](https://github.com/bigjosh/SimpleNeoPixelDemo/blob/master/SimpleNeopixelDemo/SimpleNeopixelDemo.ino) and [Adafruit Neopixel](https://github.com/adafruit/Adafruit_NeoPixel). Tested on AVR platforms and ESP8266.
* `Graphics` -- custom library. Implements basic graphic functions in XOD.
* `ST7735` -- custom library. It is used to drive ST7735 chip-based TFT LCD displays controlled by SPI.
* `SSD1306` -- custom library. It is used to drive SSD1306 chip-based monochrome TFT LCDs controlled by I2C.
* `ESP32Servo` -- https://github.com/madhephaestus/ESP32Servo includes class ESP32PWM to work with PWM channels and attach pins and `analogWrite`
