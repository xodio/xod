
#ifndef POINT_H
#define POINT_H

#include "XGraphics.h"

/*
 * Represents a point given by coordinates (x, y).
 * The `setStyle` method sets up stroke color of the point otherwise
 * the default foreground color of the scene is used.
 */
class Point : public XGraphics {
private:
    XVector2<int16_t> _a;

    XColor* _strokeColor = nullptr;

public:
    Point(XGraphics* parent);

    void setPosition(int16_t x, int16_t y);
    void setStyle(XColor* strokeColor);

    void renderScanline(XRenderer* renderer, int16_t scanline, uint16_t* buffer, size_t bufferSize);
};

#include "Point.inl"

#endif // POINT_H
