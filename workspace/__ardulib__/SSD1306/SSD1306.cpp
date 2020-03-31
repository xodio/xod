
#include "SSD1306.h"

SSD1306::SSD1306(TwoWire* wire, uint8_t i2cAddress, uint8_t* buffer) {
    _wire = wire ? wire : &Wire;
    _i2cAddress = i2cAddress;
    _buffer = buffer;
    _width = SSD1306_DISPLAY_WIDTH;
    _height = SSD1306_DISPLAY_HEIGHT;
}

void SSD1306::sendCommand(uint8_t command) {
    _wire->beginTransmission(_i2cAddress);
    _wire->write(0x80);
    _wire->write(command);
    _wire->endTransmission();
}

void SSD1306::begin() {
    _wire->begin();
    sendCommand(SSD1306_DISPLAY_OFF);
    sendCommand(SSD1306_SET_DISPLAY_CLOCK);
    sendCommand(0x80);
    sendCommand(SSD1306_SET_MULTIPLEX_RATIO);
    sendCommand(0x3F);
    sendCommand(SSD1306_SET_DISPLAY_OFFSET);
    sendCommand(0x00);
    sendCommand(SSD1306_SET_START_LINE | 0);
    sendCommand(SSD1306_CHARGE_DCDC_PUMP);
    sendCommand(0x14);
    sendCommand(SSD1306_ADDR_MODE);
    sendCommand(0x00);
    sendCommand(SSD1306_SET_REMAP_L_TO_R);
    sendCommand(SSD1306_SET_REMAP_T_TO_D);
    sendCommand(SSD1306_SET_COM_PINS);
    sendCommand(0x12);
    sendCommand(SSD1306_SET_CONTRAST);
    sendCommand(0xFF);
    sendCommand(SSD1306_SET_PRECHARGE_PERIOD);
    sendCommand(0xF1);
    sendCommand(SSD1306_SET_VCOM_DESELECT);
    sendCommand(0x40);
    sendCommand(SSD1306_RAM_ON);
    sendCommand(SSD1306_INVERT_OFF);
    sendCommand(SSD1306_DISPLAY_ON);
}

void SSD1306::sendBuffer() {
    sendCommand(SSD1306_ADDR_PAGE);
    sendCommand(0);
    sendCommand(_height / 8 - 1);
    sendCommand(SSD1306_ADDR_COLUMN);
    sendCommand(0);
    sendCommand(_width - 1);
    for (uint16_t i = 0; i < _width * _height / 8; i++) {
        _wire->beginTransmission(_i2cAddress);
        _wire->write(0x40);

        for (uint8_t x = 0; x < 16; x++)
            _wire->write(_buffer[i++]);

        i--;
        _wire->endTransmission();
    }
}

void SSD1306::clearScreen() {
    memset(_buffer, 0, _width * _height / 8);
}

void SSD1306::renderScanlinePart(int16_t scanline, int16_t xmin, int16_t xmax, const uint16_t* lineBuffer) {
    if ((scanline >= _height) || (scanline < 0))
        return;
    if ((xmin < 0) || (xmax < 0) || (xmin >= _width) || (xmax >= _width) || (xmin > xmax))
        return;

    for (int16_t x = 0; x < _width; x++) {

        /* The two-byte (RGB565) color value is stored in the form of RRRRRGGG:GGGBBBBB.
         * To get a black or white color, an artificial check for the lightness is performed.
         * Using the 11000110:00011000 bitmask, all bits except the most significant ones
         * are clipped for each color component. 0xC618 is the hex value of the bitmask. 
         */
        bool color = lineBuffer[x] & 0xC618;

        uint8_t p = scanline / 8;
        uint16_t numByte = (p * 128) + x;
        uint8_t numBit = scanline % 8;

        _buffer[numByte] = color ? _buffer[numByte] |= 1 << numBit : _buffer[numByte] &= ~(1 << numBit);
    }
}
