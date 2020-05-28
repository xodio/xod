
Line::Line(XGraphics* parent)
    : XGraphics(parent) {}

void Line::setPosition(int16_t x0, int16_t y0, int16_t x1, int16_t y1) {
    _a = XVector2<int16_t>(x0, y0);
    _b = XVector2<int16_t>(x1, y1);
}

void Line::setStyle(XColor* strokeColor) {
    _strokeColor = strokeColor;
}

void Line::renderScanline(XRenderer* renderer, int16_t scanline, uint16_t* buffer, size_t bufferSize) {

    int16_t lineMinY = min(_a.y, _b.y);
    int16_t lineMaxY = max(_a.y, _b.y);

    int16_t lineMinX = min(_a.x, _b.x);
    int16_t lineMaxX = max(_a.x, _b.x);

    if (scanline > lineMaxY || scanline < lineMinY)
        return;

    uint16_t color = xcolorTo565(_strokeColor ? *_strokeColor : getFGColor());

    if (lineMinY == lineMaxY) {
        // Straight horizontal line. Use shortcut instead of slow algorithm.

        for (int16_t x = lineMinX; x <= lineMaxX; x++)
            if (x >= 0 && x < bufferSize)
                buffer[x] = color;

    } else if (lineMinX == lineMaxX) {
        // Straight vertical line. Use shortcut instead of slow algorithm.

        if (_a.x >= 0 && _a.x < bufferSize)
            buffer[_a.x] = color;

    } else {
        // Regular diagonal line.
        putLineOnScanline(_a, _b, scanline, buffer, bufferSize, color);
    }
}
