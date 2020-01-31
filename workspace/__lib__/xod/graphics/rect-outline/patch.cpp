
// clang-format off
{{#global}}
#include <Rectangle.h>
{{/global}}
// clang-format on

struct State {
    uint8_t mem[sizeof(RectangleOutline)];
    RectangleOutline* rectangleOutline;
    int16_t x, y, w, h;
};

// clang-format off
{{ GENERATED_CODE }}
// clang-format on

void evaluate(Context ctx) {
    auto state = getState(ctx);

    auto gfx = getValue<input_GFX>(ctx);

    int16_t x = (int16_t)getValue<input_X>(ctx);
    int16_t y = (int16_t)getValue<input_Y>(ctx);
    int16_t w = (int16_t)getValue<input_W>(ctx);
    int16_t h = (int16_t)getValue<input_H>(ctx);

    if (isSettingUp()) {
        state->rectangleOutline = new (state->mem) RectangleOutline(gfx);
    }

    if (isSettingUp() || x != state->x || y != state->y || w != state->w || h != state->h) {
        state->x = x;
        state->y = y;
        state->w = w;
        state->h = h;
        state->rectangleOutline->setPosition(x, y, w, h);
        emitValue<output_GFXU0027>(ctx, state->rectangleOutline);
    }

    if (isInputDirty<input_GFX>(ctx)) {
        emitValue<output_GFXU0027>(ctx, state->rectangleOutline);
    }
}
