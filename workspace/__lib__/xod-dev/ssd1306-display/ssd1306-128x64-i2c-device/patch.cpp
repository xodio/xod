#include <SSD1306.h>

node {
    meta {
        using Type = SSD1306*;
    }

    uint8_t mem[sizeof(SSD1306)];
    uint8_t buffer[SSD1306_DISPLAY_WIDTH * SSD1306_DISPLAY_HEIGHT / 8];

    void evaluate(Context ctx) {
        if (!isSettingUp())
            return;

        auto i2c = getValue<input_I2C>(ctx);
        uint8_t addr = getValue<input_ADDR>(ctx);

        if (addr > 127) {
            raiseError(ctx);
            return;
        }

        Type dev = new (mem) SSD1306(i2c, addr, buffer);

    dev->begin();
    dev->clearScreen();
    dev->sendBuffer();

        emitValue<output_DEV>(ctx, dev);
    }
}
