
#ifndef IMAGE_SD_H
#define IMAGE_SD_H

#include "BitmapReader.h"
#include "XGraphics.h"

class ImageSD : public XGraphics {
private:
    BitmapReader _bitmapReader;
    BBox _imageBBox;

    char* _bitmapFSPath;

public:
    ImageSD(XGraphics* parent, SDClass* sd);

    bool linkBitmapFSPath(char* bitmapFSPath);

    void setImagePosition(int16_t x, int16_t y, int16_t w, int16_t h);
    void renderScanline(XRenderer* renderer, int16_t scanline, uint16_t* buffer, size_t bufferSize);
};

#include "ImageSD.inl"

#endif // IMAGE_SD_H
