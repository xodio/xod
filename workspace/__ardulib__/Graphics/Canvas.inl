
void Canvas::setPosition(int16_t x, int16_t y, int16_t w, int16_t h) {
    _pivot = XVector2<int16_t>(x, y);
    _w = w;
    _h = h;
}

void Canvas::setStyle(XColor bgColor, XColor fgColor) {
    _bgColor = bgColor;
    _fgColor = fgColor;
}

BBox Canvas::getUpstreamCanvasBBox() const {
    return { _pivot, _w, _h };
}

XColor Canvas::getFGColor() const {
    return _fgColor;
}

void Canvas::renderScanline(XRenderer* renderer, int16_t scanline, uint16_t* buffer, size_t bufferSize) {

    uint16_t color = xcolorTo565(_bgColor);

    for (int16_t x = 0; x < bufferSize; x++)
        buffer[x] = color;
}
