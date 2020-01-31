
#ifndef X_GRAPHICS_H
#define X_GRAPHICS_H

#include <Arduino.h>

#include "XRender.h"
#include "XVector2.h"

using xod::XColor;

/*
 * A structure to hold a boundary box of a geometric object.
 */
struct BBox {
    XVector2<int16_t> pivot;
    int16_t width;
    int16_t height;
};

/*
 * A base class for graphics primitives. A primitive is a single node in the scene tree which eventually
 * gets rendered. The `XGraphics` and derived classes are device-independent. They hold geometry
 * and style data, and have methods to rasterize them [scan]line-by-line into a plain pixel buffer.
 */
class XGraphics {
protected:
    XGraphics* _parent;

public:
    XGraphics();
    XGraphics(XGraphics* parent);

    virtual XColor getFGColor() const;
    virtual BBox getUpstreamCanvasBBox() const;

    /*
     * Rasterizes a specific graphics primitive for the specified `scanline`.
     */
    virtual void renderScanline(XRenderer* renderer, int16_t scanline, uint16_t* buffer, size_t bufferSize) {}
    /*
     * Rasterizes all graphics primitives in the scene tree for the specified `scanline`.
     */
    void renderScanlineRecursively(XRenderer* renderer, int16_t scanline, uint16_t* buffer, size_t bufferSize);
    /*
     * Rasterizes all graphics primitives for the specified scene.
     */
    void render(XRenderer* renderer);
};

#include "XGraphics.inl"

#endif // X_GRAPHICS_H
