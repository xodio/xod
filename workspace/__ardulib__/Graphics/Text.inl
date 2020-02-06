
Text::Text(XGraphics* parent)
    : XGraphics(parent) {}

void Text::setPosition(int16_t x, int16_t y) {
    _pivot = XVector2<int16_t>(x, y);
}

void Text::setText(XString str) {
    _str = str;
}

void Text::setTextColor(XColor* textColor) {
    _textColor = textColor;
}

void Text::setTextScale(uint8_t textScale) {
    _textScale = textScale;
}

void Text::renderScanline(XRenderer* renderer, int16_t scanline, uint16_t* buffer, size_t bufferSize) {

    if (scanline < _pivot.y || scanline > _pivot.y + 7 * _textScale - 1)
        return;

    uint16_t color = xcolorTo565(_textColor ? *_textColor : getFGColor());

    uint8_t charCount = 0;

    // For each char in the string.
    for (auto it = _str.iterate(); it; ++it, charCount++) {

        // Render only ASCII symbols from 32 to 127 else render the "?".
        char rawChar = *it;
        char renderChar = (rawChar < 32 || rawChar > 127) ? '?' : rawChar;

        // For each column of a glyph.
        for (uint8_t i = 0; i < 6; i++) {

            // Get the column of the glyph.
            uint8_t charLine = (i == 5) ? 0x00 : pgm_read_byte(&font[(renderChar - 32) * 5 + i]);

            // For each row in the column of a glyph.
            for (uint8_t j = 0; j < 8; j++) {

                // If the pixel is not shaded.
                if (!(charLine & 1 << j))
                    continue;

                // Calculate the row of the pixel (or rows if the text is scaled).
                int16_t cursorY = _pivot.y + j * _textScale;

                // Scanline intersection check during rasterisation.
                if (scanline < cursorY || scanline >= cursorY + _textScale)
                    continue;

                // Calculate the start point of the buffer to paint.
                int16_t cursorX = (charCount * 6 * _textScale) + _pivot.x + i * _textScale;

                // Paint the pixel or pixels if the text is scaled.
                for (int16_t x = cursorX; x < cursorX + _textScale; x++)
                    if (x >= 0 && x < bufferSize)
                        buffer[x] = color;
            }
        }
    }
}
