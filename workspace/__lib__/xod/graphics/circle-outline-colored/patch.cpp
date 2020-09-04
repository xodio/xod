#include <Circle.h>

node {
    uint8_t mem[sizeof(CircleOutline)];
    CircleOutline* circleOutlineColored;
    int16_t x, y, r;
    XColor strokeColor;

    void evaluate(Context ctx) {
        auto gfx = getValue<input_GFX>(ctx);
        strokeColor = getValue<input_C>(ctx);

        int16_t x = (int16_t)getValue<input_X>(ctx);
        int16_t y = (int16_t)getValue<input_Y>(ctx);
        int16_t r = (int16_t)getValue<input_R>(ctx);

        if (isSettingUp()) {
            circleOutlineColored = new (mem) CircleOutline(gfx);
        }

        if (isSettingUp() || x != x || y != y || r != r || isInputDirty<input_C>(ctx)) {
            x = x;
            y = y;
            r = r;
            circleOutlineColored->setPosition(x, y, r);
            circleOutlineColored->setStyle(&strokeColor);
            emitValue<output_GFXU0027>(ctx, circleOutlineColored);
        }

        if (isInputDirty<input_GFX>(ctx)) {
            emitValue<output_GFXU0027>(ctx, circleOutlineColored);
        }
    }

}
