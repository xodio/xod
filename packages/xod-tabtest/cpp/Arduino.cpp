
#include "Arduino.h"

static uint32_t g_time = 1;

void mockTime(uint32_t newTime) {
    g_time = newTime;
}

uint32_t millis() {
    return g_time;
}

uint32_t micros() {
    return g_time * 1000;
}

void delay(uint32_t dt) {
    // no-op
}
