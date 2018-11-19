
#include "Arduino.h"

static uint32_t g_time = 1;

uint32_t millis() {
    return ++g_time;
}

void delay(uint32_t dt) {
    g_time += dt;
}
