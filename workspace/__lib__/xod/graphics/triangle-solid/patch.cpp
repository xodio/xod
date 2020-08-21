#include <Triangle.h>

node {
    uint8_t mem[sizeof(TriangleSolid)];
    TriangleSolid* triangleSolid;
    int16_t _x0, _y0, _x1, _y1, _x2, _y2;

    void evaluate(Context ctx) {
        auto gfx = getValue<input_GFX>(ctx);

        int16_t x0 = (int16_t)getValue<input_X0>(ctx);
        int16_t y0 = (int16_t)getValue<input_Y0>(ctx);
        int16_t x1 = (int16_t)getValue<input_X1>(ctx);
        int16_t y1 = (int16_t)getValue<input_Y1>(ctx);
        int16_t x2 = (int16_t)getValue<input_X2>(ctx);
        int16_t y2 = (int16_t)getValue<input_Y2>(ctx);

        if (isSettingUp()) {
            triangleSolid = new (mem) TriangleSolid(gfx);
        }

        if (isSettingUp() || x0 != _x0 || y0 != _y0 || x1 != _x1 || y1 != _y1 || x2 != _x2 || y2 != _y2) {
            _x0 = x0;
            _y0 = y0;
            _x1 = x1;
            _y1 = y1;
            _x2 = x2;
            _y2 = y2;
            triangleSolid->setPosition(x0, y0, x1, y1, x2, y2);
            emitValue<output_GFXU0027>(ctx, triangleSolid);
        }

        if (isInputDirty<input_GFX>(ctx)) {
            emitValue<output_GFXU0027>(ctx, triangleSolid);
        }
    }
}
