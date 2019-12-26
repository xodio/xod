// This is a mash-up of the Due show() code + insights from Michael Miller's
// ESP8266 work for the NeoPixelBus library: github.com/Makuna/NeoPixelBus
// Needs to be a separate .c file to enforce ICACHE_RAM_ATTR execution.

#if defined(ESP8266) || defined(ESP32)

#include <Arduino.h>

#ifdef ESP8266
#include <eagle_soc.h>
#endif

// =============================================================================
//
// Timing
//
// =============================================================================

#if (F_CPU == 160000000L)
#define CYCLES_800_T0H (F_CPU / 2500000) // 0.4us
#define CYCLES_800_T1H (F_CPU / 1250000) // 0.8us
#define CYCLES_800 (F_CPU / 800000) // 1.25us per bit
#else
#define CYCLES_800_T0H (F_CPU / 5000000) // 0.4us
#define CYCLES_800_T1H (F_CPU / 2500000) // 0.8us
#define CYCLES_800 (F_CPU / 800000) // 1.25us per bit
#endif

static uint32_t _getCycleCount(void) __attribute__((always_inline));
static inline uint32_t _getCycleCount(void) {
    uint32_t ccount;
    __asm__ __volatile__("rsr %0,ccount"
                         : "=a"(ccount));
    return ccount;
}

// =============================================================================
//
// espSendByte function
//
// =============================================================================

#ifdef ESP8266
void ICACHE_RAM_ATTR espSendByte(uint8_t pin, uint8_t byte) {
#else
void espSendByte(uint8_t pin, uint8_t byte) {
#endif

    uint8_t mask;
    uint32_t t, time0, time1, period, c, startTime, pinMask;

    pinMask = _BV(pin);
    mask = 0x80;
    startTime = 0;

    time0 = CYCLES_800_T0H;
    time1 = CYCLES_800_T1H;
    period = CYCLES_800;

    while (mask) {
        t = (byte & mask) ? time1 : time0; // Bit duration
        while (((c = _getCycleCount()) - startTime) < period)
            ; // Wait for bit start
#ifdef ESP8266
        GPIO_REG_WRITE(GPIO_OUT_W1TS_ADDRESS, pinMask); // Set high
#else
        gpio_set_level(pin, HIGH);
#endif
        startTime = c; // Save start time
        while (((c = _getCycleCount()) - startTime) < t)
            ; // Wait high duration
#ifdef ESP8266
        GPIO_REG_WRITE(GPIO_OUT_W1TC_ADDRESS, pinMask); // Set low
#else
        gpio_set_level(pin, LOW);
#endif
        mask >>= 1;
    }
    while ((_getCycleCount() - startTime) < period)
        ; // Wait for last bit
}

#endif // ESP8266
