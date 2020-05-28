
RectangleOutline::RectangleOutline(XGraphics* parent)
    : XGraphics(parent) {}

void RectangleOutline::setPosition(int16_t x, int16_t y, int16_t w, int16_t h) {
    _a = XVector2<int16_t>(x, y);
    _w = w;
    _h = h;
}

void RectangleOutline::setStyle(XColor* strokeColor) {
    _strokeColor = strokeColor;
}

void RectangleOutline::renderScanline(XRenderer* renderer, int16_t scanline, uint16_t* buffer, size_t bufferSize) {

    if (scanline < _a.y || scanline > _a.y + _h - 1)
        return;

    uint16_t color = xcolorTo565(_strokeColor ? *_strokeColor : getFGColor());

    if (scanline == _a.y || scanline == _a.y + _h - 1) {
        // For the `scanline`, the top and bottom sides of the rectangle are straight horizontal lines.
        for (int16_t x = _a.x; x < _a.x + _w; x++)
            if (x >= 0 && x < bufferSize)
                buffer[x] = color;

    } else {
        // The left and right sides of the rectangle are specific points for `scanline`.

        if (_a.x >= 0 && _a.x < bufferSize)
            buffer[_a.x] = color;
        if ((_a.x + _w - 1) >= 0 && (_a.x + _w - 1) < bufferSize)
            buffer[_a.x + _w - 1] = color;
    }
}

RectangleSolid::RectangleSolid(XGraphics* parent)
    : XGraphics(parent) {}

void RectangleSolid::setPosition(int16_t x, int16_t y, int16_t w, int16_t h) {
    _a = XVector2<int16_t>(x, y);
    _w = w;
    _h = h;
}

void RectangleSolid::setStyle(XColor* fillColor) {
    _fillColor = fillColor;
}

void RectangleSolid::renderScanline(XRenderer* renderer, int16_t scanline, uint16_t* buffer, size_t bufferSize) {

    if (scanline < _a.y || scanline > _a.y + _h - 1)
        return;

    uint16_t color = xcolorTo565(_fillColor ? *_fillColor : getFGColor());

    for (int16_t x = _a.x; x < _a.x + _w; x++)
        if (x >= 0 && x < bufferSize)
            buffer[x] = color;
}
