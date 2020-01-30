
// clang-format off
{{#global}}
#include <Point.h>
{{/global}}
// clang-format on

struct State {
    uint8_t mem[sizeof(Point)];
    Point* pointColored;
    int16_t x, y;
    XColor strokeColor;
};

// clang-format off
{{ GENERATED_CODE }}
// clang-format on

void evaluate(Context ctx) {

    auto state = getState(ctx);
    auto gfx = getValue<input_GFX>(ctx);

    state->strokeColor = getValue<input_C>(ctx);

    int16_t x = (int16_t)getValue<input_X>(ctx);
    int16_t y = (int16_t)getValue<input_Y>(ctx);

    if (isSettingUp()) {
        state->pointColored = new (state->mem) Point(gfx);
    }

    if (isSettingUp() || state->x != x || state->y != y || isInputDirty<input_C>(ctx)) {
        state->x = x;
        state->y = y;
        state->pointColored->setPosition(x, y);
        state->pointColored->setStyle(&state->strokeColor);
        emitValue<output_GFXU0027>(ctx, state->pointColored);
    }

    if (isInputDirty<input_GFX>(ctx)) {
        emitValue<output_GFXU0027>(ctx, state->pointColored);
    }
}
