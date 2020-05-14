
Image::Image(XGraphics* parent)
    : XGraphics(parent) {}

void Image::setImagePosition(int16_t x, int16_t y, int16_t w, int16_t h) {
    _imageBBox.pivot = XVector2<int16_t>(x, y);
    _imageBBox.width = w;
    _imageBBox.height = h;
}

void Image::linkBitmap(Bitmap* bitmap) {
    _bitmap = bitmap;
}

void Image::renderScanline(XRenderer* renderer, int16_t scanline, uint16_t* buffer, size_t bufferSize) {

    if (scanline < _imageBBox.pivot.y || scanline > _imageBBox.pivot.y + _imageBBox.height - 1)
        return;

    uint8_t bitmapColorDepth = _bitmap->colorDepth;

    uint16_t bitmapWidth = _bitmap->width;
    uint16_t bitmapHeight = _bitmap->height;

    if (bitmapColorDepth > 0) { // If the bitmap is colored or colored with alpha color.

        uint16_t bitmapKeyColor = _bitmap->keyColor;

        // Calculating the line of a bitmap taking the vertical tiling into account.
        int16_t line = (scanline - (_imageBBox.pivot.y + bitmapHeight * ((scanline - _imageBBox.pivot.y) / bitmapHeight))) * bitmapWidth * 2;

        for (int16_t x = _imageBBox.pivot.x, c = 0; x < _imageBBox.pivot.x + _imageBBox.width; x++, c = c + 2) {

            // Tile horizontally.
            if (c == bitmapWidth * 2) c = 0;
        
            uint8_t b0 = pgm_read_byte(&_bitmap->buffer[line + c]);
            uint8_t b1 = pgm_read_byte(&_bitmap->buffer[line + c + 1]);
        
            uint16_t color = ((uint16_t)b0 << 8) | b1;

            if (bitmapColorDepth == 2) // If the bitmap is colored with alpha color.
                if (color == bitmapKeyColor) // If the pixel color equals alpha color then skip it.
                    continue;

            if (x >= 0 && x < bufferSize)
                buffer[x] = color;
        }

    } else { // If the bitmap is black and white.

        int16_t line = (scanline - (_imageBBox.pivot.y + bitmapHeight * ((scanline - _imageBBox.pivot.y) / bitmapHeight)));
        uint8_t bytesInLine = (bitmapWidth % 8 == 0) ? bitmapWidth / 8 : bitmapWidth / 8 + 1;

        for (int16_t x = _imageBBox.pivot.x, i = 0; x < _imageBBox.pivot.x + _imageBBox.width; x++, i++) {

            if (i == bitmapWidth) i = 0;
            uint8_t byteNum = i / 8;

            uint8_t byte = pgm_read_byte(&_bitmap->buffer[line * bytesInLine + byteNum]);

            uint8_t bitNum = 7 - (i % 8);

            uint16_t color = (byte & (1 << bitNum)) ? 0xFFFF : 0x0000;

            if (x >= 0 && x < bufferSize)
                buffer[x] = color;

        }
    }
}
