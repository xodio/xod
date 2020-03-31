
#ifndef TEXT_H
#define TEXT_H

#ifdef __AVR__
#include <avr/pgmspace.h>
#elif defined(ESP8266) || defined(ESP32)
#include <pgmspace.h>
#endif // __AVR__

/*
 * Not all non-AVR boards installs define macros
 * for compatibility with existing PROGMEM-reading AVR code.
 */
#ifndef pgm_read_byte
#define pgm_read_byte(addr) (*(const unsigned char *)(addr))
#endif

#include "XGraphics.h"
#include "Fonts/glcdfont.h"

using xod::XString;

/*
 * Represents a text given by a pivot point (x, y) which is the top left point of the text.
 * By now this class uses only the standard 5x7 GLCD ASCII font.
 * The `setTextColor` method sets up text color otherwise
 * the default foreground color of the scene is used.
 * The `setTextScale` method sets up the value that scales the font.
 * The `setText` method sets up the new string to render.
 */
class Text : public XGraphics {
private:
    XVector2<int16_t> _pivot;
    XString _str;
    XColor* _textColor = nullptr;
    uint8_t _textScale = 1;

public:
    Text(XGraphics* parent);

    void setPosition(int16_t x, int16_t y);
    void setText(XString str);
    void setTextColor(XColor* textColor);
    void setTextScale(uint8_t textScale);
    
    void renderScanline(XRenderer* renderer, int16_t scanline, uint16_t* buffer, size_t bufferSize);
};

#include "Text.inl"

#endif // TEXT_H
