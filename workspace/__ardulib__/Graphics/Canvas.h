
#ifndef CANVAS_H
#define CANVAS_H

#include "XGraphics.h"

/*
 * Represents a rectangular piece of the screen (i.e. scene) which gets redrawn
 * completely when at least a single child `XGraphics` element on it is updated.
 * Holds the backgound color for the scene and the default foreground color for
 * the child graphics primitives. 
 */
class Canvas : public XGraphics {
private:
    XColor _bgColor;
    XColor _fgColor = { 0xFF, 0xFF, 0xFF };

    XVector2<int16_t> _pivot;
    int16_t _w;
    int16_t _h;

public:
    void setPosition(int16_t x, int16_t y, int16_t w, int16_t h);
    void setStyle(XColor bgColor, XColor fgColor);

    BBox getUpstreamCanvasBBox() const;
    XColor getFGColor() const;

    void renderScanline(XRenderer* renderer, int16_t scanline, uint16_t* buffer, size_t bufferSize);
};

#include "Canvas.inl"

#endif // CANVAS_H
