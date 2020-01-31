
#ifndef RECTANGLE_H
#define RECTANGLE_H

#include "XGraphics.h"

/*
 * Represents a rectangle frame given by a top-left point (x0, y0), width and height.
 * The `setStyle` method sets up stroke color of the rectangle frame otherwise
 * the default foreground color of the scene is used.
 */
class RectangleOutline : public XGraphics {
private:
    XVector2<int16_t> _a;
    int16_t _w = 0;
    int16_t _h = 0;

    XColor* _strokeColor = nullptr;

public:
    RectangleOutline(XGraphics* parent);

    void setPosition(int16_t x, int16_t y, int16_t w, int16_t h);
    void setStyle(XColor* strokeColor);

    void renderScanline(XRenderer* renderer, int16_t scanline, uint16_t* buffer, size_t bufferSize);
};

/*
 * Represents a filled rectangle given by a top-left point (x0, y0), width and height.
 * The `setStyle` method sets up fill color of the rectangle otherwise
 * the default foreground color of the scene is used.
 */
class RectangleSolid : public XGraphics {
private:
    XVector2<int16_t> _a;
    int16_t _w = 0;
    int16_t _h = 0;

    XColor* _fillColor = nullptr;

public:
    RectangleSolid(XGraphics* parent);

    void setPosition(int16_t x, int16_t y, int16_t w, int16_t h);
    void setStyle(XColor* fillColor);

    void renderScanline(XRenderer* renderer, int16_t scanline, uint16_t* buffer, size_t bufferSize);
};

#include "Rectangle.inl"

#endif // RECTANGLE_H
