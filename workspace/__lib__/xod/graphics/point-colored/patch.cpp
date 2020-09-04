#include <Point.h>
node {
    uint8_t mem[sizeof(Point)];
    Point* pointColored;
    int16_t _x, _y;
    XColor strokeColor;

    void evaluate(Context ctx) {
        auto gfx = getValue<input_GFX>(ctx);

        strokeColor = getValue<input_C>(ctx);

        int16_t x = (int16_t)getValue<input_X>(ctx);
        int16_t y = (int16_t)getValue<input_Y>(ctx);

        if (isSettingUp()) {
            pointColored = new (mem) Point(gfx);
        }

        if (isSettingUp() || x != _x || y != _y || isInputDirty<input_C>(ctx)) {
            _x = x;
            _y = y;
            pointColored->setPosition(x, y);
            pointColored->setStyle(&strokeColor);
            emitValue<output_GFXU0027>(ctx, pointColored);
        }

        if (isInputDirty<input_GFX>(ctx)) {
            emitValue<output_GFXU0027>(ctx, pointColored);
        }
    }
}
