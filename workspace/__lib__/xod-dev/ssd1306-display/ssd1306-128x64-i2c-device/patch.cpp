
// clang-format off
{{#global}}
#include <SSD1306.h>
{{/global}}
// clang-format on

struct State {
    uint8_t mem[sizeof(SSD1306)];
    uint8_t buffer[SSD1306_DISPLAY_WIDTH * SSD1306_DISPLAY_HEIGHT / 8];
};

using Type = SSD1306*;

// clang-format off
{{ GENERATED_CODE }}
// clang-format on

void evaluate(Context ctx) {
    if (!isSettingUp())
        return;

    auto state = getState(ctx);

    auto i2c = getValue<input_I2C>(ctx);
    uint8_t addr = getValue<input_ADDR>(ctx);

    if (addr > 127) {
        raiseError(ctx);
        return;
    }

    Type dev = new (state->mem) SSD1306(i2c, addr, state->buffer);

    dev->begin();
    dev->clearScreen();

    emitValue<output_DEV>(ctx, dev);
}
