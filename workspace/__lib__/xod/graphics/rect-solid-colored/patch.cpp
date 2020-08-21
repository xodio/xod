#include <Rectangle.h>

node {
    uint8_t mem[sizeof(RectangleSolid)];
    RectangleSolid* rectangleSolidColored;
    int16_t _x, _y, _w, _h;
    XColor fillColor;

    void evaluate(Context ctx) {
        auto gfx = getValue<input_GFX>(ctx);
        fillColor = getValue<input_C>(ctx);

        int16_t x = (int16_t)getValue<input_X>(ctx);
        int16_t y = (int16_t)getValue<input_Y>(ctx);
        int16_t w = (int16_t)getValue<input_W>(ctx);
        int16_t h = (int16_t)getValue<input_H>(ctx);

        if (isSettingUp()) {
            rectangleSolidColored = new (mem) RectangleSolid(gfx);
        }

        if (isSettingUp() || x != _x || y != _y || w != _w || h != _h || isInputDirty<input_C>(ctx)) {
            _x = x;
            _y = y;
            _w = w;
            _h = h;
            rectangleSolidColored->setPosition(x, y, w, h);
            rectangleSolidColored->setStyle(&fillColor);
            emitValue<output_GFXU0027>(ctx, rectangleSolidColored);
        }

        if (isInputDirty<input_GFX>(ctx)) {
            emitValue<output_GFXU0027>(ctx, rectangleSolidColored);
        }
    }
}
