#include <Point.h>

node {
    uint8_t mem[sizeof(Point)];
    Point* point;
    int16_t _x, _y;

    void evaluate(Context ctx) {
        auto gfx = getValue<input_GFX>(ctx);

        int16_t x = (int16_t)getValue<input_X>(ctx);
        int16_t y = (int16_t)getValue<input_Y>(ctx);

        if (isSettingUp()) {
            point = new (mem) Point(gfx);
        }

        if (isSettingUp() || x != _x || y != _y) {
            _x = x;
            _y = y;
            point->setPosition(x, y);
            emitValue<output_GFXU0027>(ctx, point);
        }

        if (isInputDirty<input_GFX>(ctx)) {
            emitValue<output_GFXU0027>(ctx, point);
        }
    }
}
