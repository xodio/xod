
// clang-format off
{{#global}}
#include <Rectangle.h>
{{/global}}
// clang-format on

struct State {
    uint8_t mem[sizeof(RectangleSolid)];
    RectangleSolid* rectangleSolidColored;
    int16_t x, y, w, h;
    XColor fillColor;
};

// clang-format off
{{ GENERATED_CODE }}
// clang-format on

void evaluate(Context ctx) {
    auto state = getState(ctx);

    auto gfx = getValue<input_GFX>(ctx);
    state->fillColor = getValue<input_C>(ctx);

    int16_t x = (int16_t)getValue<input_X>(ctx);
    int16_t y = (int16_t)getValue<input_Y>(ctx);
    int16_t w = (int16_t)getValue<input_W>(ctx);
    int16_t h = (int16_t)getValue<input_H>(ctx);

    if (isSettingUp()) {
        state->rectangleSolidColored = new (state->mem) RectangleSolid(gfx);
    }

    if (isSettingUp() || x != state->x || y != state->y || w != state->w || h != state->h || isInputDirty<input_C>(ctx)) {
        state->x = x;
        state->y = y;
        state->w = w;
        state->h = h;
        state->rectangleSolidColored->setPosition(x, y, w, h);
        state->rectangleSolidColored->setStyle(&state->fillColor);
        emitValue<output_GFXU0027>(ctx, state->rectangleSolidColored);
    }

    if (isInputDirty<input_GFX>(ctx)) {
        emitValue<output_GFXU0027>(ctx, state->rectangleSolidColored);
    }
}
