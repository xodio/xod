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

void WS2812::fill(XColor color) {
  cli();
  for (uint32_t i = 0; i < _length; i++) {
      sendPixel(color.r, color.g, color.b);
  }
  sei();
  show();
}

void WS2812::fill(XColor color, uint32_t pixelCount, bool fromTail) {
  cli();
  // If fromTail is true
  // Skip pixels by filling them with black color
  uint32_t pixelsToSkip = fromTail ? _length - pixelCount : 0;
  for (uint32_t i = 0; i < pixelsToSkip && i < _length; i++) {
      sendPixel(0, 0, 0);
  }
  // Fill pixels
  for (uint32_t i = pixelsToSkip; i < (pixelsToSkip + pixelCount); i++) {
      sendPixel(color.r, color.g, color.b);
  }
  sei();
  show();
}

void WS2812::fillPattern(Pattern* pat, uint32_t shift) {
    PatternNode* first = pat->first();
    PatternNode* cur = first;
    uint32_t _shift = (uint32_t) shift % _length;
    for (uint32_t s = 0; s < _shift; s++) {
      cur = cur->nextLooped(first);
    }
    cli();
    for (uint32_t i = 0; i < _length; i++) {
      XColor color = cur->color();
      sendPixel(color.r, color.g, color.b);
      cur = cur->nextLooped(first);
    }
    sei();
    show();
}
