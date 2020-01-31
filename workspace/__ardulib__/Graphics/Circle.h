
#ifndef CIRCLE_H
#define CIRCLE_H

#include "XGraphics.h"

/*
 * Represents a circle given by a center point (x0, y0) and radius.
 * The `setStyle` method sets up stroke color of the circle otherwise
 * the default foreground color of the scene is used.
 */
class CircleOutline : public XGraphics {
private:
    XVector2<int16_t> _a;
    int16_t _r = 0;

    XColor* _strokeColor = nullptr;

public:
    CircleOutline(XGraphics* parent);

    void setPosition(int16_t x, int16_t y, int16_t r);
    void setStyle(XColor* strokeColor);

    void renderScanline(XRenderer* renderer, int16_t scanline, uint16_t* buffer, size_t bufferSize);
};

/*
 * Represents a filled circle given by a center point (x0, y0) and radius.
 * The `setStyle` method sets up fill color of the circle otherwise
 * the default foreground color of the scene is used.
 */
class CircleSolid : public XGraphics {
private:
    XVector2<int16_t> _a;
    int16_t _r = 0;

    XColor* _fillColor = nullptr;

public:
    CircleSolid(XGraphics* parent);

    void setPosition(int16_t x, int16_t y, int16_t r);
    void setStyle(XColor* fillColor);

    void renderScanline(XRenderer* renderer, int16_t scanline, uint16_t* buffer, size_t bufferSize);
};

#include "Circle.inl"

#endif // CIRCLE_H
