#ifndef _WS2812_NO_BUFFER_H_
#define _WS2812_NO_BUFFER_H_

#include "XColorPattern.h"

using xod::XColor;

// These are the timing constraints taken mostly from the WS2812 datasheets
// These are chosen to be conservative and avoid problems rather than for maximum throughput
#define T1H 800 // Width of a 1 bit in ns
#define T1L 450 // Width of a 1 bit in ns

#define T0H 400 // Width of a 0 bit in ns
#define T0L 850 // Width of a 0 bit in ns

// The reset gap can be 6000 ns, but depending on the LED strip it may have to be increased
// to values like 600000 ns. If it is too small, the pixels will show nothing most of the time
// or update of the pixel may affect the next one, because of small RES signal between 24-bit packages
#define RES 100000 // Width of the low gap between bits to cause a frame to latch

// Here are some convience defines for using nanoseconds specs to generate actual CPU delays
#define NS_PER_SEC (1000000000L) // Note that this has to be SIGNED since we want to be able to check for negative values of derivatives
#define CYCLES_PER_SEC (F_CPU)
#define NS_PER_CYCLE (NS_PER_SEC / CYCLES_PER_SEC)
#define NS_TO_CYCLES(n) ((n) / NS_PER_CYCLE)

#ifndef _delay_us
#define _delay_us(us) delayMicroseconds(us)
#endif

class WS2812 {
public:
    WS2812(uint8_t pin, uint32_t length);
    void fill(uint8_t r, uint8_t g, uint8_t b);
    void fill(XColor color);
    void fill(XColor color, uint32_t pixelCount, bool fromTail = false);
    void fillPattern(Pattern* pat, uint32_t shift = 0);
    void sendPixel(uint8_t r, uint8_t g, uint8_t b);
    void show();
    uint32_t getLength() const;

private:
    uint32_t _length;
#ifdef __AVR__
    // On AVR platform port registers are stored in PROGMEM and decltype
    // can't get the type of it, so we just inlined it here
    volatile uint8_t* _port;
#else
    // On ESP we can use decltype and it resolves to `volatile uint32_t*`
    decltype(portOutputRegister(0)) _port;
#endif
    uint8_t _pin;
    void setup(uint8_t pin);
    void sendBit(bool);
    void sendByte(uint8_t);
};

#include "WS2812.inl"

#endif
