#include <Canvas.h>

node {
    uint8_t mem[sizeof(Canvas)];
    Canvas* canvas;
    int16_t x, y, w, h;

    void evaluate(Context ctx) {
        auto bgColor = getValue<input_BG>(ctx);
        auto fgColor = getValue<input_FG>(ctx);

        int16_t x = (int16_t)getValue<input_X>(ctx);
        int16_t y = (int16_t)getValue<input_Y>(ctx);
        int16_t w = (int16_t)getValue<input_W>(ctx);
        int16_t h = (int16_t)getValue<input_H>(ctx);

        if (isSettingUp()) {
            canvas = new (mem) Canvas();
        }

        if (isSettingUp() || x != x || y != y || w != w || h != h || isInputDirty<input_BG>(ctx) || isInputDirty<input_FG>(ctx)) {
            x = x;
            y = y;
            w = w;
            h = h;
            canvas->setPosition(x, y, w, h);
            canvas->setStyle(bgColor, fgColor);
            emitValue<output_GFX>(ctx, canvas);
        }
    }
}
