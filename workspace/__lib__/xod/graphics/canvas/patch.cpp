
// clang-format off
{{#global}}
#include <Canvas.h>
{{/global}}
// clang-format on

struct State {
    uint8_t mem[sizeof(Canvas)];
    Canvas* canvas;
    int16_t x, y, w, h;
};

// clang-format off
{{ GENERATED_CODE }}
// clang-format on

void evaluate(Context ctx) {

    auto state = getState(ctx);

    auto bgColor = getValue<input_BG>(ctx);
    auto fgColor = getValue<input_FG>(ctx);

    int16_t x = (int16_t)getValue<input_X>(ctx);
    int16_t y = (int16_t)getValue<input_Y>(ctx);
    int16_t w = (int16_t)getValue<input_W>(ctx);
    int16_t h = (int16_t)getValue<input_H>(ctx);

    if (isSettingUp()) {
        state->canvas = new (state->mem) Canvas();
    }

    if (isSettingUp() || x != state->x || y != state->y || w != state->w || h != state->h || isInputDirty<input_BG>(ctx) || isInputDirty<input_FG>(ctx)) {
        state->x = x;
        state->y = y;
        state->w = w;
        state->h = h;
        state->canvas->setPosition(x, y, w, h);
        state->canvas->setStyle(bgColor, fgColor);
        emitValue<output_GFX>(ctx, state->canvas);
    }
}
