
// clang-format off
{{#global}}
#include <XST7735.h>
{{/global}}
// clang-format on

struct State {
    uint8_t mem[sizeof(ST7735)];
    ST7735* dev;
};

using Type = ST7735*;

// clang-format off
{{ GENERATED_CODE }}
// clang-format on

void evaluate(Context ctx) {
    static_assert(isValidDigitalPort(constant_input_CS), "must be a valid digital port");
    static_assert(isValidDigitalPort(constant_input_DC), "must be a valid digital port");
    static_assert(constant_input_RST == 255 || isValidDigitalPort(constant_input_RST), "must be a valid digital port");

    if (!isSettingUp())
        return;

    auto state = getState(ctx);

    const uint8_t cs = getValue<input_CS>(ctx);
    const uint8_t dc = getValue<input_DC>(ctx);
    const uint8_t rst = getValue<input_RST>(ctx);

    state->dev = new (state->mem) ST7735(cs, dc, rst);

    emitValue<output_DEV>(ctx, state->dev);
}
