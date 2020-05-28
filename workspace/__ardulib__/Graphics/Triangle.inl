/*
 * This is the common algorithm for drawing filled triangles. The original triangle is divided
 * into two triangles with a flat bottom base and a flat top base. The resulting triangles
 * are drawn sequentially. A good place to read about the algorithm "http://www.sunshine2k.de/coding/java/TriangleRasterization/TriangleRasterization.html".
 * This implementation is augmented by the scanline intersection check during rasterization.
 */

void putTriangleSolidOnScanline(XVector2<int16_t> a, XVector2<int16_t> b, XVector2<int16_t> c, int16_t scanline, uint16_t* buffer, size_t bufferSize, uint16_t color) {

    int16_t xa, xb;
    int16_t line, lastLine;

    int16_t dx01 = b.x - a.x;
    int16_t dy01 = b.y - a.y;
    int16_t dx02 = c.x - a.x;
    int16_t dy02 = c.y - a.y;
    int16_t dx12 = c.x - b.x;
    int16_t dy12 = c.y - b.y;

    int32_t sa = 0;
    int32_t sb = 0;

    // Trivial case check for the flat top/bottom triangle.
    if (b.y == c.y)
        lastLine = b.y;
    else
        lastLine = b.y - 1;

    // Find scanline crossings for the upper triagnle part.
    for (line = a.y; line <= lastLine; line++) {

        xa = a.x + sa / dy01;
        xb = a.x + sb / dy02;
        sa += dx01;
        sb += dx02;

        if (line == scanline) {

            // This check is for the correct filling of the buffer.
            if (xa > xb)
                swapInt16(xa, xb);

            for (int16_t x = xa; x <= xb; x++)
                if (x >= 0 && x < bufferSize)
                    buffer[x] = color;
        }
    }

    sa = (int32_t)dx12 * (line - b.y);
    sb = (int32_t)dx02 * (line - a.y);

    // Find scanline crossings for the lower triagnle part.
    for (; line <= c.y; line++) {

        xa = b.x + sa / dy12;
        xb = a.x + sb / dy02;
        sa += dx12;
        sb += dx02;

        if (line == scanline) {

            // This check is for the correct filling of the buffer.
            if (xa > xb)
                swapInt16(xa, xb);

            for (int16_t x = xa; x <= xb; x++)
                if (x >= 0 && x < bufferSize)
                    buffer[x] = color;
        }
    }
}

TriangleOutline::TriangleOutline(XGraphics* parent)
    : XGraphics(parent) {}

void TriangleOutline::setPosition(int16_t x0, int16_t y0, int16_t x1, int16_t y1, int16_t x2, int16_t y2) {
    _a = XVector2<int16_t>(x0, y0);
    _b = XVector2<int16_t>(x1, y1);
    _c = XVector2<int16_t>(x2, y2);
}

void TriangleOutline::setStyle(XColor* strokeColor) {
    _strokeColor = strokeColor;
}

void TriangleOutline::renderScanline(XRenderer* renderer, int16_t scanline, uint16_t* buffer, size_t bufferSize) {

    int16_t lineMinY = min(_c.y, min(_a.y, _b.y));
    int16_t lineMaxY = max(_c.y, max(_a.y, _b.y));

    if (scanline > lineMaxY || scanline < lineMinY)
        return;

    uint16_t color = xcolorTo565(_strokeColor ? *_strokeColor : getFGColor());

    putLineOnScanline(_a, _b, scanline, buffer, bufferSize, color);
    putLineOnScanline(_b, _c, scanline, buffer, bufferSize, color);
    putLineOnScanline(_c, _a, scanline, buffer, bufferSize, color);
}

TriangleSolid::TriangleSolid(XGraphics* parent)
    : XGraphics(parent) {}

void TriangleSolid::setPosition(int16_t x0, int16_t y0, int16_t x1, int16_t y1, int16_t x2, int16_t y2) {

    // Sort Y coordinates by order. It's need to be done for the rasterization algorithm.
    if (y0 > y1) {
        swapInt16(y0, y1);
        swapInt16(x0, x1);
    }
    if (y1 > y2) {
        swapInt16(y2, y1);
        swapInt16(x2, x1);
    }
    if (y0 > y1) {
        swapInt16(y0, y1);
        swapInt16(x0, x1);
    }

    _a = XVector2<int16_t>(x0, y0);
    _b = XVector2<int16_t>(x1, y1);
    _c = XVector2<int16_t>(x2, y2);
}

void TriangleSolid::setStyle(XColor* fillColor) {
    _fillColor = fillColor;
}

void TriangleSolid::renderScanline(XRenderer* renderer, int16_t scanline, uint16_t* buffer, size_t bufferSize) {

    if (scanline > _c.y || scanline < _a.y)
        return;

    uint16_t color = xcolorTo565(_fillColor ? *_fillColor : getFGColor());

    putTriangleSolidOnScanline(_a, _b, _c, scanline, buffer, bufferSize, color);
}
