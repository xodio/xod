#include <Circle.h>

node {
    uint8_t mem[sizeof(CircleSolid)];
    CircleSolid* circleSolid;
    int16_t _x, _y, _r;

    void evaluate(Context ctx) {
        auto gfx = getValue<input_GFX>(ctx);

        int16_t x = (int16_t)getValue<input_X>(ctx);
        int16_t y = (int16_t)getValue<input_Y>(ctx);
        int16_t r = (int16_t)getValue<input_R>(ctx);

        if (isSettingUp()) {
            circleSolid = new (mem) CircleSolid(gfx);
        }

        if (isSettingUp() || x != _x || y != _y || r != _r) {
            _x = x;
            _y = y;
            _r = r;
            circleSolid->setPosition(x, y, r);
            emitValue<output_GFXU0027>(ctx, circleSolid);
        }

        if (isInputDirty<input_GFX>(ctx)) {
            emitValue<output_GFXU0027>(ctx, circleSolid);
        }
    }
};
