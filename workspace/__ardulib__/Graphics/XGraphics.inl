
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

    int16_t pivotX = max(0, (int)canvasBBox.pivot.x);
    int16_t pivotY = max(0, (int)canvasBBox.pivot.y);

    size_t bufferSize = (pivotX + canvasBBox.width >= screenWidth) ? screenWidth - pivotX : canvasBBox.width;

    int16_t scanlineCount = (pivotY + canvasBBox.height >= screenHeight) ? screenHeight - pivotY : canvasBBox.height;

    for (int16_t scanline = 0; scanline < scanlineCount; scanline++) {
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

void swapInt16(int16_t& a, int16_t& b) {
    int16_t t = a;
    a = b;
    b = t;
}

/*
 * The Bresenham's line algorithm [Wikipedia](https://en.wikipedia.org/wiki/Bresenham%27s_line_algorithm).
 * This implementation is augmented by the scanline intersection check during rasterisation.
 * The standard algorithm assumes that the `b.x` > `a.x` and `b.y` > `a.y`. The `steep` value is used to eliminate
 * this condition and to calculate a line at points with any coordinates.
 */
void putLineOnScanline(XVector2<int16_t> a, XVector2<int16_t> b, int16_t scanline, uint16_t* buffer, size_t bufferSize, uint16_t color) {

    int16_t steep = abs(b.y - a.y) > abs(b.x - a.x);
    if (steep) {
        swapInt16(a.x, a.y);
        swapInt16(b.x, b.y);
    }

    if (a.x > b.x) {
        swapInt16(a.x, b.x);
        swapInt16(a.y, b.y);
    }

    int16_t dx, dy;
    dx = b.x - a.x;
    dy = abs(b.y - a.y);

    int16_t err = dx / 2;
    int16_t ystep;

    if (a.y < b.y) {
        ystep = 1;
    } else {
        ystep = -1;
    }

    for (; a.x <= b.x; a.x++) {
        if (steep) {
            if (scanline == a.x)
                if (a.y >= 0 && a.y < bufferSize)
                    buffer[a.y] = color;
        } else {
            if (scanline == a.y)
                if (a.x >= 0 && a.x < bufferSize)
                    buffer[a.x] = color;
        }
        err -= dy;
        if (err < 0) {
            a.y += ystep;
            err += dx;
        }
    }
}
