
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
