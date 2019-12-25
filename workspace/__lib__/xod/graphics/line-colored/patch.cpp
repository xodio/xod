
// clang-format off
{{#global}}
#include <Line.h>
{{/global}}
// clang-format on

struct State {
    uint8_t mem[sizeof(Line)];
    Line* lineColored;
    int16_t x0, y0, x1, y1;
    XColor strokeColor;
};

// clang-format off
{{ GENERATED_CODE }}
// clang-format on

void evaluate(Context ctx) {
    auto state = getState(ctx);

    auto gfx = getValue<input_GFX>(ctx);
    state->strokeColor = getValue<input_C>(ctx);

    int16_t x0 = (int16_t)getValue<input_X0>(ctx);
    int16_t y0 = (int16_t)getValue<input_Y0>(ctx);
    int16_t x1 = (int16_t)getValue<input_X1>(ctx);
    int16_t y1 = (int16_t)getValue<input_Y1>(ctx);

    if (isSettingUp()) {
        state->lineColored = new (state->mem) Line(gfx);
    }

    if (isSettingUp() || x0 != state->x0 || y0 != state->y0 || x1 != state->x1 || y1 != state->y1 || isInputDirty<input_C>(ctx)) {
        state->x0 = x0;
        state->y0 = y0;
        state->x1 = x1;
        state->y1 = y1;
        state->lineColored->setPosition(x0, y0, x1, y1);
        state->lineColored->setStyle(&state->strokeColor);
        emitValue<output_GFXU0027>(ctx, state->lineColored);
    }

    if (isInputDirty<input_GFX>(ctx)) {
        emitValue<output_GFXU0027>(ctx, state->lineColored);
    }
}
