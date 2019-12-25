
XGraphics::XGraphics() {
    _parent = nullptr;
}

XGraphics::XGraphics(XGraphics* parent) {
    _parent = parent;
}

XColor XGraphics::getFGColor() const {
    return _parent ? _parent->getFGColor() : XColor();
}

BBox XGraphics::getUpstreamCanvasBBox() const {
    return _parent ? _parent->getUpstreamCanvasBBox() : BBox({ { 0, 0 }, 0, 0 });
}

void XGraphics::render(XRenderer* renderer) {

    BBox canvasBBox = getUpstreamCanvasBBox();

    int16_t screenWidth = renderer->getScreenWidth();
    int16_t screenHeight = renderer->getScreenHeight();

    int16_t pivotX = max(0, canvasBBox.pivot.x);
    int16_t pivotY = max(0, canvasBBox.pivot.y);

    size_t bufferSize = (pivotX + canvasBBox.width >= screenWidth) ? screenWidth - pivotX : canvasBBox.width;

    int16_t scanlineCount = (pivotY + canvasBBox.height >= screenHeight) ? screenHeight - pivotY : canvasBBox.height;

    for (int16_t scanline = 0; scanline <= scanlineCount; scanline++) {
        uint16_t buffer[bufferSize];
        renderScanlineRecursively(renderer, scanline, buffer, bufferSize);
        renderer->renderScanlinePart(pivotY + scanline, pivotX, pivotX + bufferSize - 1, buffer);
    }
}

void XGraphics::renderScanlineRecursively(XRenderer* renderer, int16_t scanline, uint16_t* buffer, size_t bufferSize) {

    if (_parent != nullptr)
        _parent->renderScanlineRecursively(renderer, scanline, buffer, bufferSize);

    renderScanline(renderer, scanline, buffer, bufferSize);
}

inline uint16_t xcolorTo565(XColor color) {
    return ((color.r & 0xF8) << 8) | ((color.g & 0xFC) << 3) | (color.b >> 3);
}
