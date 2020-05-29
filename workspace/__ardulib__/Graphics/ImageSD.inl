
ImageSD::ImageSD(XGraphics* parent, SDClass* sd)
    : XGraphics(parent) {
    _bitmapReader.linkSDDevice(sd);
}

bool ImageSD::linkBitmapFSPath(char* bitmapFSPath) {
    _bitmapFSPath = bitmapFSPath;
    BitmapReturnCode res = _bitmapReader.readBitmap(_bitmapFSPath);
    return res == BITMAP_SUCCESS ? 0 : 1;
}

void ImageSD::setImagePosition(int16_t x, int16_t y, int16_t w, int16_t h) {
    _imageBBox.pivot = XVector2<int16_t>(x, y);
    _imageBBox.width = w;
    _imageBBox.height = h;
}

void ImageSD::renderScanline(XRenderer* renderer, int16_t scanline, uint16_t* buffer, size_t bufferSize) {

    if (scanline < _imageBBox.pivot.y || scanline > _imageBBox.pivot.y + _imageBBox.height - 1)
        return;

    _bitmapReader.fillScanlineBuffer(_bitmapFSPath, scanline, _imageBBox, buffer, bufferSize);
}
