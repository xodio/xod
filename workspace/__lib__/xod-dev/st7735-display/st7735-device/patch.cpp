
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
    if (!isSettingUp())
        return;

    auto state = getState(ctx);

    const uint8_t cs = getValue<input_CS>(ctx);
    const uint8_t dc = getValue<input_DC>(ctx);
    const uint8_t rst = getValue<input_RST>(ctx);

    state->dev = new (state->mem) ST7735(cs, dc, rst);

    emitValue<output_DEV>(ctx, state->dev);
}

template <uint8_t cs, uint8_t dc, uint8_t rst>
void evaluateTmpl(Context ctx) {
    static_assert(isValidDigitalPort(cs), "must be a valid digital port");
    static_assert(isValidDigitalPort(dc), "must be a valid digital port");
    static_assert(rst == 255 || isValidDigitalPort(rst), "must be a valid digital port");
    evaluate(ctx);
}
