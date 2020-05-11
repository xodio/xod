
#ifndef BITMAP_READER_H
#define BITMAP_READER_H

#include <SD.h>
#include "XGraphics.h"

enum BitmapReturnCode { // It is invisible to the enduser but very useful for debugging.
    BITMAP_SUCCESS,
    BITMAP_ERROR_FILE_OPEN,
    BITMAP_ERROR_WRONG_FILE_FORMAT,
    BITMAP_ERROR_WRONG_BMP
};

struct BitmapHeader {
    BitmapHeader()
        : bfOffBits(0)
        , biSize(0)
        , biWidth(0)
        , biHeight(0)
        , isFlipped(false)
        , biPlanes(0)
        , biBitCount(0)
        , biCompression(0) {}

    uint32_t bfOffBits; // The offset, i.e. starting address, of the byte where the bitmap image data (pixel array) can be found.
    uint8_t biSize; // The size of the header.
    int16_t biWidth; // The bitmap width in pixels.
    int16_t biHeight; // The bitmap height in pixels. Can be < 0.
    bool isFlipped; // A BMP is stored bottom-to-top.
    uint8_t biPlanes; // The number of color planes, must be 1. Other values used for WIN icons.
    uint8_t biBitCount; // the number of bits per pixel, which is the color depth of the image. Typical values are 1, 4, 8, 16, 24 and 32.
    uint8_t biCompression; // the compression method being used. Typical values are [0,6].
};

class BitmapReader {
public:
    ~BitmapReader();

    void linkSDDevice(SDClass* sd);

    BitmapReturnCode readBitmap(char* bitmapFSPath);
    BitmapReturnCode fillScanlineBuffer(char* bitmapFSPath, int16_t scanline, BBox imageBBox, uint16_t* buffer, size_t bufferSize);

private:
    SDClass* _sd;
    File _file;

    BitmapHeader _bitmapHeader;

    uint16_t _readLE16();
    uint32_t _readLE32();
};

BitmapReader::~BitmapReader() {
    if (_file)
        _file.close();
}

void BitmapReader::linkSDDevice(SDClass* sd) {
    _sd = sd;
}

BitmapReturnCode BitmapReader::readBitmap(char* bitmapFSPath) {

    if (!(_file = _sd->open(bitmapFSPath, O_READ))) { // Open a new BMP file.
        _file.close();
        return BITMAP_ERROR_FILE_OPEN;
    }

    if (_readLE16() != 0x4D42) { // Check BMP signature.
        _file.close();
        return BITMAP_ERROR_WRONG_FILE_FORMAT;
    }

    _readLE32(); // Skip reading bfSize.
    _readLE32(); // Skip reading bfReserved.

    _bitmapHeader.bfOffBits = _readLE32(); // Read bfOffBits.
    _bitmapHeader.biSize = _readLE32(); // Read biSize/bV4Size/bV5Size.

    _bitmapHeader.biWidth = _readLE32(); // Read biWidth/bV4Width/bV5Width.
    _bitmapHeader.biHeight = _readLE32(); // Read biHeight/bV4Height/bV5Height.
    if (_bitmapHeader.biHeight < 0) {
        _bitmapHeader.biHeight = -_bitmapHeader.biHeight;
        _bitmapHeader.isFlipped = true;
    }

    _bitmapHeader.biPlanes = _readLE16(); // Read biPlanes/bV4Planes/bV5Planes.
    _bitmapHeader.biBitCount = _readLE16(); // Read biBitCount/bV4BitCount/bV5BitCount.
    _bitmapHeader.biCompression = _readLE32(); // Read biCompression/bV4V4Compression/bV5Compression.

    _file.close();

    // Check for only straightforward case.
    if (_bitmapHeader.biSize != 40 || _bitmapHeader.biPlanes != 1 || _bitmapHeader.biBitCount != 24 || _bitmapHeader.biCompression != 0) {
        _bitmapHeader = BitmapHeader(); // Reset bitmap.
        return BITMAP_ERROR_WRONG_BMP;
    }

    return BITMAP_SUCCESS;
}

BitmapReturnCode BitmapReader::fillScanlineBuffer(char* bitmapFSPath, int16_t scanline, BBox imageBBox, uint16_t* buffer, size_t bufferSize) {
    if (!(_file = _sd->open(bitmapFSPath, O_READ))) {
        _file.close();
        return BITMAP_ERROR_FILE_OPEN;
    }

    uint16_t imageLine = scanline - imageBBox.pivot.y; // Calculate current line of the image.

    if (imageLine > _bitmapHeader.biHeight - 1) // Tile vert. If more than one BMP in the image.
        imageLine = imageLine - _bitmapHeader.biHeight * (imageLine / _bitmapHeader.biHeight);

    uint16_t bitmapArrayLine = _bitmapHeader.isFlipped ? imageLine : _bitmapHeader.biHeight - imageLine - 1; // Calculate current Bitmap line.

    uint8_t emptyBytesCount = _bitmapHeader.biWidth % 4; // The amount of bytes at the BMP scanline must be a multiple of 4 bytes.
    uint32_t bitmapLineStart = _bitmapHeader.bfOffBits + bitmapArrayLine * 3 * _bitmapHeader.biWidth + emptyBytesCount * bitmapArrayLine; // The number of starting byte of the line.

        for (int16_t x = imageBBox.pivot.x, c = 0; x < imageBBox.pivot.x + imageBBox.width; x++, c++) {

            if ((c == 0) || (c % (_bitmapHeader.biWidth - 1) == 0)) // Tile horizontally. If we are at frame.
                if (!(_file.seek(bitmapLineStart))) // Return to start.
                    continue; // If for some case miss the byte, do not read it.

            uint16_t color = ((_file.read() >> 3) | ((_file.read() & 0xFC) << 3) | ((_file.read() & 0xF8) << 8)); // in BMP a pixel color is hold as BGR888.
            if (x >= 0 && x < bufferSize)
                buffer[x] = color;
        }

    _file.close();
    return BITMAP_SUCCESS;
}

uint16_t BitmapReader::_readLE16() {
#if !defined(ESP32) && !defined(ESP8266) && (__BYTE_ORDER__ == __ORDER_LITTLE_ENDIAN__)
    // Read directly into result. BMP data and variable both little-endian.
    uint16_t result;
    _file.read(&result, sizeof result);
    return result;
#else
    // Big-endian or unknown. Byte-by-byte read will perform reversal if needed.
    return _file.read() | ((uint16_t)_file.read() << 8);
#endif
}

uint32_t BitmapReader::_readLE32() {
#if !defined(ESP32) && !defined(ESP8266) && (__BYTE_ORDER__ == __ORDER_LITTLE_ENDIAN__)
    // Read directly into result. BMP data and variable both little-endian.
    uint32_t result;
    _file.read(&result, sizeof result);
    return result;
#else
    // Big-endian or unknown. Byte-by-byte read will perform reversal if needed.
    return _file.read() | ((uint16_t)_file.read() << 8) | ((uint16_t)_file.read() << 16) | ((uint16_t)_file.read() << 24);
#endif
}

#endif // BITMAP_READER_H
