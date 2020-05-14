
#ifndef IMAGE_H
#define IMAGE_H

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
#include "Bitmap.h"

class Image : public XGraphics {
private:
    BBox _imageBBox;
    Bitmap* _bitmap;

public:
    Image(XGraphics* parent);

    void setImagePosition(int16_t x, int16_t y, int16_t w, int16_t h);
    void linkBitmap(Bitmap* bitmap);

    void renderScanline(XRenderer* renderer, int16_t scanline, uint16_t* buffer, size_t bufferSize);
};

#include "Image.inl"

#endif // BITMAP_H
