
#ifndef TRIANGLE_H
#define TRIANGLE_H

#include "XGraphics.h"

/*
 * Represents a triangle given by three points (x0, y0), (x1, y1), (x2, y2).
 * The `setStyle` method sets up stroke color of the triangle otherwise
 * the default foreground color of the scene is used.
 */
class TriangleOutline : public XGraphics {
private:
    XVector2<int16_t> _a;
    XVector2<int16_t> _b;
    XVector2<int16_t> _c;

    XColor* _strokeColor = nullptr;

public:
    TriangleOutline(XGraphics* parent);

    void setPosition(int16_t x0, int16_t y0, int16_t x1, int16_t y1, int16_t x2, int16_t y2);
    void setStyle(XColor* strokeColor);

    void renderScanline(XRenderer* renderer, int16_t scanline, uint16_t* buffer, size_t bufferSize);
};

/*
 * Represents a filled triangle given by three points (x0, y0), (x1, y1), (x2, y2).
 * The `setStyle` method sets up fill color of the triangle otherwise
 * the default foreground color of the scene is used.
 */
class TriangleSolid : public XGraphics {
private:
    XVector2<int16_t> _a;
    XVector2<int16_t> _b;
    XVector2<int16_t> _c;

    XColor* _fillColor = nullptr;

public:
    TriangleSolid(XGraphics* parent);

    void setPosition(int16_t x0, int16_t y0, int16_t x1, int16_t y1, int16_t x2, int16_t y2);
    void setStyle(XColor* fillColor);

    void renderScanline(XRenderer* renderer, int16_t scanline, uint16_t* buffer, size_t bufferSize);
};

#include "Triangle.inl"

#endif // TRIANGLE_H
