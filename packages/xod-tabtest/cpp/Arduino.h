
#ifndef ARDUINO_H
#define ARDUINO_H

#include <stddef.h> // for size_t
#include <stdint.h> // for uint32_t, etc
#include <string.h> // for strlen
#include <stdlib.h> // for fcvt
#include <math.h>

void setup();
void loop();

uint32_t millis();
void delay(uint32_t);

#endif
