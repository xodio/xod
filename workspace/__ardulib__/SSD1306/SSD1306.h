
#ifndef X_SSD1306_H
#define X_SSD1306_H

#include <Wire.h>
#include <XRender.h>


#define SSD1306_DISPLAY_OFF 0xAE
#define SSD1306_SET_DISPLAY_CLOCK 0xD5
#define SSD1306_SET_MULTIPLEX_RATIO 0xA8
#define SSD1306_SET_DISPLAY_OFFSET 0xD3
#define SSD1306_SET_START_LINE 0x40
#define SSD1306_CHARGE_DCDC_PUMP 0x8D
#define SSD1306_ADDR_MODE 0x20
#define SSD1306_SET_REMAP_L_TO_R 0xA1
#define SSD1306_SET_REMAP_T_TO_D 0xC8
#define SSD1306_SET_COM_PINS 0xDA
#define SSD1306_SET_CONTRAST 0x81
#define SSD1306_SET_PRECHARGE_PERIOD 0xD9
#define SSD1306_SET_VCOM_DESELECT 0xDB
#define SSD1306_RAM_ON 0xA4
#define SSD1306_INVERT_OFF 0xA6
#define SSD1306_DISPLAY_ON 0xAF
#define SSD1306_ADDR_PAGE 0x22
#define SSD1306_ADDR_COLUMN 0x21

#define SSD1306_DISPLAY_WIDTH 128
#define SSD1306_DISPLAY_HEIGHT 64

class SSD1306 : public XRenderer {
public:
    SSD1306(TwoWire* wire, uint8_t i2cAddress, uint8_t* buffer);

    int16_t getScreenWidth() const {
        return _width;
    }
    int16_t getScreenHeight() const {
        return _height;
    }

    void begin();
    void sendBuffer();
    void clearScreen();

    void renderScanlinePart(int16_t scanline, int16_t xmin, int16_t xmax, const uint16_t* lineBuffer) override;

private:
    TwoWire* _wire = nullptr;
    uint8_t _i2cAddress = 0x00;
    uint8_t* _buffer;
    int16_t _width = 0;
    int16_t _height = 0;

    void _sendCommand(uint8_t command);
    void _sendCommand(uint8_t command, uint8_t value);
    void _sendCommand(uint8_t command, uint8_t value1, uint8_t value2);
};

#endif // X_SSD1306_H
