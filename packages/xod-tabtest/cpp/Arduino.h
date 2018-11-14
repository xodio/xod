
#ifndef ARDUINO_H
#define ARDUINO_H

#include <stddef.h> // for size_t
#include <stdint.h> // for uint32_t, etc
#include <string.h> // for strlen
#include <stdlib.h> // for fcvt
#include <math.h>

void setup();
void loop();

#define A0 14

// undefine stdlib's abs if encountered
// because all platforms' Arduino.h do it
#ifdef abs
#undef abs
#endif
#define abs(x) ((x)>0?(x):-(x))

uint32_t millis();
void delay(uint32_t);

class Stream {
  public:
    void begin(uint32_t) {};
    void end() {};

    bool available() { return true; };
    bool write(char) { return true; };
    uint8_t read() { return 1; };
    void flush() {};
};
class SoftwareSerial : public Stream {};
class HardwareSerial : public Stream {};

#endif
