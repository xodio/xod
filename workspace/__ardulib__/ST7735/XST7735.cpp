
#include "XST7735.h"

inline uint16_t swapColor565(uint16_t color) {
    return (color << 11) | (color & 0x07E0) | (color >> 11);
}

ST7735::ST7735(uint8_t cs, uint8_t dc, uint8_t rst) {
    _cs = cs;
    _rs = dc;
    _rst = rst;
    _width = ST7735_TFTWIDTH_128;
    _height = ST7735_TFTHEIGHT_160;
}

void ST7735::writeCmd(uint8_t cmd) {

#ifdef SPI_HAS_TRANSACTION
    SPI.beginTransaction(spisettings);
#endif

    *rsport &= ~rspinmask;

    *csport &= ~cspinmask;
    SPI.transfer(cmd);
    *csport |= cspinmask;

#ifdef SPI_HAS_TRANSACTION
    SPI.endTransaction();
#endif
}

void ST7735::writeData(uint8_t data) {

#ifdef SPI_HAS_TRANSACTION
    SPI.beginTransaction(spisettings);
#endif

    *rsport |= rspinmask;

    *csport &= ~cspinmask;
    SPI.transfer(data);
    *csport |= cspinmask;

#ifdef SPI_HAS_TRANSACTION
    SPI.endTransaction();
#endif
}

void ST7735::setAddrWindow(uint8_t x0, uint8_t y0, uint8_t x1, uint8_t y1) {
    writeCmd(ST7735_CASET);
    writeData(0x00);
    writeData(x0 + _colstart);
    writeData(0x00);
    writeData(x1 + _colstart);

    writeCmd(ST7735_RASET);
    writeData(0x00);
    writeData(y0 + _rowstart);
    writeData(0x00);
    writeData(y1 + _rowstart);

    writeCmd(ST7735_RAMWR);
}

void ST7735::commandList(const uint8_t* addr) {

    uint8_t numCommands = pgm_read_byte(addr++); // Number of commands to follow.
    uint8_t numArgs;
    uint16_t ms;

    while (numCommands--) { // For each command.
        writeCmd(pgm_read_byte(addr++)); // Read, issue command.
        numArgs = pgm_read_byte(addr++); // Number of args to follow.
        ms = numArgs & DELAY; // If hibit set, delay follows args.
        numArgs &= ~DELAY; // Mask out delay bit.
        while (numArgs--) { // For each argument.
            writeData(pgm_read_byte(addr++)); // Read, issue argument.
        }

        if (ms) {
            ms = pgm_read_byte(addr++); // Read post-command delay time (ms).
            if (ms == 255)
                ms = 500; // If 255, delay for 500 ms.
            delay(ms);
        }
    }
}

void ST7735::setRotation(uint8_t rotation) {
    uint8_t madctl = 0;

    switch (rotation) {
    case 0:
        madctl = ST77XX_MADCTL_MX | ST77XX_MADCTL_MY | ST7735_MADCTL_BGR;
        _height = ST7735_TFTHEIGHT_160;
        _width = ST7735_TFTWIDTH_128;
        break;
    case 1:
        madctl = ST77XX_MADCTL_MY | ST77XX_MADCTL_MV | ST7735_MADCTL_BGR;
        _width = ST7735_TFTHEIGHT_160;
        _height = ST7735_TFTWIDTH_128;
        break;
    case 2:
        madctl = ST7735_MADCTL_BGR;
        _height = ST7735_TFTHEIGHT_160;
        _width = ST7735_TFTWIDTH_128;
        break;
    case 3:
        madctl = ST77XX_MADCTL_MX | ST77XX_MADCTL_MV | ST7735_MADCTL_BGR;
        _width = ST7735_TFTHEIGHT_160;
        _height = ST7735_TFTWIDTH_128;
        break;
    default:
        break;
    }

    writeCmd(ST77XX_MADCTL);
    writeData(madctl);
}

void ST7735::begin() {

    _colstart = _rowstart = 0; // May be overridden in init func.

    pinMode(_rs, OUTPUT);
    pinMode(_cs, OUTPUT);
    csport = portOutputRegister(digitalPinToPort(_cs));
    cspinmask = digitalPinToBitMask(_cs);
    rsport = portOutputRegister(digitalPinToPort(_rs));
    rspinmask = digitalPinToBitMask(_rs);

    SPI.begin();

#ifdef SPI_HAS_TRANSACTION
    spisettings = SPISettings(4000000L, MSBFIRST, SPI_MODE0);
#else
#if defined(ARDUINO_ARCH_SAM)
    SPI.setClockDivider(24); // 4 MHz (half speed).
#else
    SPI.setClockDivider(SPI_CLOCK_DIV4); // 4 MHz (half speed).
#endif // ARDUINO_ARCH_SAM
    SPI.setBitOrder(MSBFIRST);
    SPI.setDataMode(SPI_MODE0);
#endif // SPI_HAS_TRANSACTION

    // Toggle RST low to reset; CS low so it'll listen to us.
    *csport &= ~cspinmask;
    if (_rst == 255)
        return;

    pinMode(_rst, OUTPUT);
    digitalWrite(_rst, HIGH);
    delay(100);
    digitalWrite(_rst, LOW);
    delay(100);
    digitalWrite(_rst, HIGH);
    delay(200);
}

void ST7735::initTypeG() {
    begin();
    if (Gcmd)
        commandList(Gcmd);
}

void ST7735::initTypeB() {
    begin();
    if (Bcmd)
        commandList(Bcmd);
}

void ST7735::initTypeRG() {
    begin();
    _swappedColorBytes = true;
    _colstart = 2;
    _rowstart = 1;
    if (Rcmd1)
        commandList(Rcmd1);
    if (Rcmd2green)
        commandList(Rcmd2green);
    if (Rcmd3)
        commandList(Rcmd3);
}

void ST7735::initTypeRR() {
    begin();
    if (Rcmd1)
        commandList(Rcmd1);
    if (Rcmd2red)
        commandList(Rcmd2red);
    if (Rcmd3)
        commandList(Rcmd3);
}

void ST7735::renderScanlinePart(int16_t scanline, int16_t xmin, int16_t xmax, const uint16_t* lineBuffer) {

    if ((scanline >= _height) || (scanline < 0))
        return;
    if ((xmin < 0) || (xmax < 0) || (xmin >= _width) || (xmax >= _width) || (xmin > xmax))
        return;

    setAddrWindow(xmin, scanline, xmax, scanline);

#ifdef SPI_HAS_TRANSACTION
    SPI.beginTransaction(spisettings);
#endif // SPI_HAS_TRANSACTION

    *rsport |= rspinmask;

    *csport &= ~cspinmask;

    for (uint16_t x = 0; x <= xmax - xmin; x++) {

        uint16_t color = _swappedColorBytes ? swapColor565(lineBuffer[x]) : lineBuffer[x];

        uint8_t hi = color >> 8;
        uint8_t lo = color;
        SPI.transfer(hi);
        SPI.transfer(lo);
    }
    *csport |= cspinmask;

#ifdef SPI_HAS_TRANSACTION
    SPI.endTransaction();
#endif // SPI_HAS_TRANSACTION
}
