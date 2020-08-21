#include <Circle.h>

node {
    uint8_t mem[sizeof(CircleOutline)];
    CircleOutline* circleOutline;
    int16_t x, y, r;

    void evaluate(Context ctx) {
        auto gfx = getValue<input_GFX>(ctx);

        int16_t x = (int16_t)getValue<input_X>(ctx);
        int16_t y = (int16_t)getValue<input_Y>(ctx);
        int16_t r = (int16_t)getValue<input_R>(ctx);

        if (isSettingUp()) {
            circleOutline = new (mem) CircleOutline(gfx);
        }

        if (isSettingUp() || x != x || y != y || r != r) {
            x = x;
            y = y;
            r = r;
            circleOutline->setPosition(x, y, r);
            emitValue<output_GFXU0027>(ctx, circleOutline);
        }

        if (isInputDirty<input_GFX>(ctx)) {
            emitValue<output_GFXU0027>(ctx, circleOutline);
        }
    }
}
