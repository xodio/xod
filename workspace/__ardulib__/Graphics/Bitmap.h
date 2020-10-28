
#ifndef BITMAP_H
#define BITMAP_H

using xod::XColor;

/*
 * A structure to hold basic bitmap parameters.
 */
struct Bitmap {
    Bitmap(const uint8_t* newBuffer, uint8_t newColorDepth = 0, uint16_t newWidth = 0, uint16_t newHeight = 0, uint16_t newKeyColor = 0x0000) {
        buffer = newBuffer;
        colorDepth = newColorDepth;
        width = newWidth;
        height = newHeight;
        keyColor = newKeyColor;
    }

    const uint8_t* buffer;
    uint8_t colorDepth; // 0 = Black and white bitmap, 1 = Colored bitmap (565 format), 2 = Colored bitmap (565) with mask color;
    uint16_t width;
    uint16_t height;
    uint16_t keyColor;
};

#endif // BITMAP_H
