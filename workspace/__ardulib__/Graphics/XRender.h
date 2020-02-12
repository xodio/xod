
#ifndef X_RENDERER_H
#define X_RENDERER_H

/*
 * Pure virtual renderer, should be overridden by the renderer of a specific device.
 */
class XRenderer {
public:
    virtual void renderScanlinePart(int16_t scanline, int16_t xmin, int16_t xmax, const uint16_t* lineBuffer) = 0;

    virtual int16_t getScreenWidth() const;
    virtual int16_t getScreenHeight() const;
};

#endif // X_RENDERER_H
