
#ifndef LINE_H
#define LINE_H

#include "XGraphics.h"

/*
 * Represents a line given by two points A(x0, y0) and B(x1, y1).
 * The `setStyle` method sets up stroke color of the line otherwise
 * the default foreground color of the scene is used.
 */
class Line : public XGraphics {
private:
    XVector2<int16_t> _a;
    XVector2<int16_t> _b;

    XColor* _strokeColor = nullptr;

public:
    Line(XGraphics* parent);

    void setPosition(int16_t x0, int16_t y0, int16_t x1, int16_t y1);
    void setStyle(XColor* strokeColor);

    void renderScanline(XRenderer* renderer, int16_t scanline, uint16_t* buffer, size_t bufferSize);
};

#include "Line.inl"

#endif // LINE_H
