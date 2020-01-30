
Point::Point(XGraphics* parent)
    : XGraphics(parent) {}

void Point::setPosition(int16_t x, int16_t y) {
    _a = XVector2<int16_t>(x, y);
}

void Point::setStyle(XColor* strokeColor) {
    _strokeColor = strokeColor;
}

void Point::renderScanline(XRenderer* renderer, int16_t scanline, uint16_t* buffer, size_t bufferSize) {

    if (scanline != _a.y)
        return;

    uint16_t color = xcolorTo565(_strokeColor ? *_strokeColor : getFGColor());

    if (_a.x >= 0 && _a.x < bufferSize)
        buffer[_a.x] = color;
}
