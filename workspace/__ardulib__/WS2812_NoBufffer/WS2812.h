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

#include "WS2812.h"

WS2812::WS2812(uint8_t pin, uint32_t len) {
    _length = len;
    setup(pin);
}

int8_t getBitPosition(uint8_t b) {
    int8_t pos = -1;
    uint8_t t = b;
    while (t > 0) {
        t >>= 1;
        pos++;
    }
    return pos;
}

// Set the specified pin up as digital out
void WS2812::setup(uint8_t pin) {
    pinMode(pin, OUTPUT);
    digitalWrite(pin, LOW);
    _port = portOutputRegister(digitalPinToPort(pin));
#if defined(ESP8266) || defined(ESP32)
    // Store pin number as is for ESP. See `esp8266.c` for details
    _pin = pin;
#else
    // Get position of bit in the register that corresponds to the selected pin
    // E.G. fourth bit in register PORTB on Arduino Uno corresponds to the port #12
    _pin = getBitPosition(digitalPinToBitMask(pin));
#endif
}

uint32_t WS2812::getLength() const {
    return _length;
}

#define SEND_BIT(_ON, _OFF, _PORT, _BIT)              \
    if (_port == &_PORT && _pin == _BIT) {            \
        asm volatile(                                 \
            "sbi %[port], %[bit] \n\t"                \
            ".rept %[onCycles] \n\t"                  \
            "nop \n\t"                                \
            ".endr \n\t"                              \
            "cbi %[port], %[bit] \n\t"                \
            ".rept %[offCycles] \n\t"                 \
            "nop \n\t"                                \
            ".endr \n\t" ::                           \
                [port] "I"(_SFR_IO_ADDR(_PORT)),      \
            [bit] "I"(_BIT),                          \
            [onCycles] "I"(NS_TO_CYCLES(_ON) - 2),    \
            [offCycles] "I"(NS_TO_CYCLES(_OFF) - 2)); \
    }

#define SEND_BITS(_ON, _OFF, _PORT) \
    SEND_BIT(_ON, _OFF, _PORT, 0);  \
    SEND_BIT(_ON, _OFF, _PORT, 1);  \
    SEND_BIT(_ON, _OFF, _PORT, 2);  \
    SEND_BIT(_ON, _OFF, _PORT, 3);  \
    SEND_BIT(_ON, _OFF, _PORT, 4);  \
    SEND_BIT(_ON, _OFF, _PORT, 5);  \
    SEND_BIT(_ON, _OFF, _PORT, 6);  \
    SEND_BIT(_ON, _OFF, _PORT, 7);

// Actually send a bit to the strip. We must to drop to asm to enusre that the complier does
// not reorder things and make it so the delay happens in the wrong place.
void WS2812::sendBit(bool bitVal) {
    if (bitVal) {
        // 0 bit
#ifdef PORTA
        SEND_BITS(T1H, T1L, PORTA);
#endif
#ifdef PORTB
        SEND_BITS(T1H, T1L, PORTB);
#endif
#ifdef PORTC
        SEND_BITS(T1H, T1L, PORTC);
#endif
#ifdef PORTD
        SEND_BITS(T1H, T1L, PORTD);
#endif
#ifdef PORTE
        SEND_BITS(T1H, T1L, PORTE);
#endif
#ifdef PORTF
        SEND_BITS(T1H, T1L, PORTF);
#endif
#ifdef PORTG
        SEND_BITS(T1H, T1L, PORTG);
#endif
    } else {
        // 1 bit
#ifdef PORTA
        SEND_BITS(T0H, T0L, PORTA);
#endif
#ifdef PORTB
        SEND_BITS(T0H, T0L, PORTB);
#endif
#ifdef PORTC
        SEND_BITS(T0H, T0L, PORTC);
#endif
#ifdef PORTD
        SEND_BITS(T0H, T0L, PORTD);
#endif
#ifdef PORTE
        SEND_BITS(T0H, T0L, PORTE);
#endif
#ifdef PORTF
        SEND_BITS(T0H, T0L, PORTF);
#endif
#ifdef PORTG
        SEND_BITS(T0H, T0L, PORTG);
#endif
    }
}

#if defined(ESP8266)
// ESP8266 show() is external to enforce ICACHE_RAM_ATTR execution
extern "C" void ICACHE_RAM_ATTR espSendByte(uint8_t pin, uint8_t byte);
#elif defined(ESP32)
extern "C" void espSendByte(uint8_t pin, uint8_t byte);
#endif // ESP8266

void WS2812::sendByte(uint8_t byte) {
#if defined(ESP8266) || defined(ESP32)
    // ESP8266 show() is external to enforce ICACHE_RAM_ATTR execution
    espSendByte(_pin, byte);
#else
    for (uint8_t bit = 0; bit < 8; bit++) {
        sendBit(bitRead(byte, 7)); // Neopixel wants bit in highest-to-lowest order
            // so send highest bit (bit #7 in an 8-bit byte since they start at 0)
        byte <<= 1; // and then shift left so bit 6 moves into 7, 5 moves into 6, etc
    }
#endif
}

void WS2812::sendPixel(uint8_t r, uint8_t g, uint8_t b) {
    // Neopixel wants colors in green then red then blue order
    sendByte(g);
    sendByte(r);
    sendByte(b);
}

// Just wait long enough without sending any bots to cause the pixels to latch and display the last sent frame
void WS2812::show() {
    _delay_us((RES / 1000UL) + 1); // Round up since the delay must be _at_least_ this long (too short might not work, too long not a problem)
}

// Display a single color on the whole strip
void WS2812::fill(uint8_t r, uint8_t g, uint8_t b) {
    cli();
    for (uint32_t i = 0; i < _length; i++) {
        sendPixel(r, g, b);
    }
    sei();
    show();
}
void WS2812::fillPattern(Pattern* pat, uint32_t shift = 0) {
    cli();

    PatternNode* first = pat->first();
    PatternNode* cur = first;
    uint32_t _shift = (uint32_t) shift % _length;
    for (uint32_t s = 0; s < _shift; s++) {
      cur = cur->nextLooped(first);
    }
    for (uint32_t i = 0; i < _length; i++) {
      XColor color = cur->color();
      sendPixel(color.r, color.g, color.b);
      cur = cur->nextLooped(first);
    }
    sei();
    show();
}


#endif
