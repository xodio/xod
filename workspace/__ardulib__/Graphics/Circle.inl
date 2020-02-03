
/*
 * The Midpoint Circle Algorithm for drawing circles [Wikipedia](https://en.wikipedia.org/wiki/Midpoint_circle_algorithm).
 * This implementation is augmented by the scanline intersection check during rasterisation.
 */
void putCircleOutlineOnScanline(XVector2<int16_t> a, int16_t r, int16_t scanline, uint16_t* buffer, size_t bufferSize, uint16_t color) {

    int16_t f = 1 - r;
    int16_t ddfX = 1;
    int16_t ddfY = -2 * r;
    int16_t x = 0;
    int16_t y = r;

    if (scanline == a.y) {
        if (a.x + r >= 0 && a.x + r < bufferSize)
            buffer[a.x + r] = color;
        if (a.x - r >= 0 && a.x - r < bufferSize)
            buffer[a.x - r] = color;
    }
    if (scanline == a.y + r || scanline == a.y - r)
        if (a.x >= 0 && a.x < bufferSize)
            buffer[a.x] = color;

    while (x < y) {

        if (f >= 0) {
            y--;
            ddfY += 2;
            f += ddfY;
        }
        x++;
        ddfX += 2;
        f += ddfX;

        if (scanline == a.y + y) {
            if (a.x + x >= 0 && a.x + x < bufferSize)
                buffer[a.x + x] = color;
            if (a.x - x >= 0 && a.x - x < bufferSize)
                buffer[a.x - x] = color;
        }
        if (scanline == a.y - y) {
            if (a.x + x >= 0 && a.x + x < bufferSize)
                buffer[a.x + x] = color;
            if (a.x - x >= 0 && a.x - x < bufferSize)
                buffer[a.x - x] = color;
        }
        if (scanline == a.y + x) {
            if (a.x + y >= 0 && a.x + y < bufferSize)
                buffer[a.x + y] = color;
            if (a.x - y >= 0 && a.x - y < bufferSize)
                buffer[a.x - y] = color;
        }
        if (scanline == a.y - x) {
            if (a.x + y >= 0 && a.x + y < bufferSize)
                buffer[a.x + y] = color;
            if (a.x - y >= 0 && a.x - y < bufferSize)
                buffer[a.x - y] = color;
        }
    }
}

/*
 * Modified the Midpoint Circle Algorithm for drawing filled circles.
 * This implementation is augmented by the scanline intersection check during rasterisation.
 */
void putCircleSolidOnScanline(XVector2<int16_t> a, int16_t r, int16_t scanline, uint16_t* buffer, size_t bufferSize, uint16_t color) {

    int16_t x = r;
    int16_t y = 0;
    int16_t xChange = 1 - 2 * r;
    int16_t yChange = 0;
    int16_t radiusError = 0;

    while (x >= y) {

        if (scanline == a.y + y || scanline == a.y - y)
            for (int16_t i = a.x - x; i <= a.x + x; i++)
                if (i >= 0 && i < bufferSize)
                    buffer[i] = color;

        if (scanline == a.y + x || scanline == a.y - x)
            for (int16_t i = a.x - y; i <= a.x + y; i++)
                if (i >= 0 && i < bufferSize)
                    buffer[i] = color;

        y++;
        radiusError += yChange;
        yChange += 2;
        if ((radiusError * 2 + xChange) > 0) {
            x--;
            radiusError += xChange;
            xChange += 2;
        }
    }
}

CircleOutline::CircleOutline(XGraphics* parent)
    : XGraphics(parent) {}

void CircleOutline::setPosition(int16_t x, int16_t y, int16_t r) {
    _a = XVector2<int16_t>(x, y);
    _r = r;
}

void CircleOutline::setStyle(XColor* strokeColor) {
    _strokeColor = strokeColor;
}

void CircleOutline::renderScanline(XRenderer* renderer, int16_t scanline, uint16_t* buffer, size_t bufferSize) {

    if (scanline < _a.y - _r || scanline > _a.y + _r)
        return;

    uint16_t color = xcolorTo565(_strokeColor ? *_strokeColor : getFGColor());

    putCircleOutlineOnScanline(_a, _r, scanline, buffer, bufferSize, color);
}

CircleSolid::CircleSolid(XGraphics* parent)
    : XGraphics(parent) {}

void CircleSolid::setPosition(int16_t x, int16_t y, int16_t r) {
    _a = XVector2<int16_t>(x, y);
    _r = r;
}

void CircleSolid::setStyle(XColor* fillColor) {
    _fillColor = fillColor;
}

void CircleSolid::renderScanline(XRenderer* renderer, int16_t scanline, uint16_t* buffer, size_t bufferSize) {

    if (scanline < _a.y - _r || scanline > _a.y + _r)
        return;

    uint16_t color = xcolorTo565(_fillColor ? *_fillColor : getFGColor());

    putCircleSolidOnScanline(_a, _r, scanline, buffer, bufferSize, color);
}
