#include <Circle.h>

node {
    uint8_t mem[sizeof(CircleSolid)];
    CircleSolid* circleSolidColored;
    int16_t x, y, r;
    XColor fillColor;

    void evaluate(Context ctx) {
        auto gfx = getValue<input_GFX>(ctx);
        fillColor = getValue<input_C>(ctx);

        int16_t x = (int16_t)getValue<input_X>(ctx);
        int16_t y = (int16_t)getValue<input_Y>(ctx);
        int16_t r = (int16_t)getValue<input_R>(ctx);

        if (isSettingUp()) {
            circleSolidColored = new (mem) CircleSolid(gfx);
        }

        if (isSettingUp() || x != x || y != y || r != r || isInputDirty<input_C>(ctx)) {
            x = x;
            y = y;
            r = r;
            circleSolidColored->setPosition(x, y, r);
            circleSolidColored->setStyle(&fillColor);
            emitValue<output_GFXU0027>(ctx, circleSolidColored);
        }

        if (isInputDirty<input_GFX>(ctx)) {
            emitValue<output_GFXU0027>(ctx, circleSolidColored);
        }
    }

};
