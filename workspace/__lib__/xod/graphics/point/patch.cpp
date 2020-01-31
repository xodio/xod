
// clang-format off
{{#global}}
#include <Point.h>
{{/global}}
// clang-format on

struct State {
    uint8_t mem[sizeof(Point)];
    Point* point;
    int16_t x, y;
};

// clang-format off
{{ GENERATED_CODE }}
// clang-format on

void evaluate(Context ctx) {

    auto state = getState(ctx);
    auto gfx = getValue<input_GFX>(ctx);

    int16_t x = (int16_t)getValue<input_X>(ctx);
    int16_t y = (int16_t)getValue<input_Y>(ctx);

    if (isSettingUp()) {
        state->point = new (state->mem) Point(gfx);
    }

    if (isSettingUp() || state->x != x || state->y != y) {
        state->x = x;
        state->y = y;
        state->point->setPosition(x, y);
        emitValue<output_GFXU0027>(ctx, state->point);
    }

    if (isInputDirty<input_GFX>(ctx)) {
        emitValue<output_GFXU0027>(ctx, state->point);
    }
}
