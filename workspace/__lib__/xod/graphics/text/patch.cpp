#include <Text.h>

node {
    uint8_t mem[sizeof(Text)];
    Text* text;
    uint8_t _textScale;
    int16_t _x, _y;

    void evaluate(Context ctx) {
        auto gfx = getValue<input_GFX>(ctx);

        int16_t x = (int16_t)getValue<input_X>(ctx);
        int16_t y = (int16_t)getValue<input_Y>(ctx);
        uint8_t textScale = max(1, (int)getValue<input_SCL>(ctx));

        if (isSettingUp()) {
            text = new (mem) Text(gfx);
        }

        if (isSettingUp() || _x != x || _y != y || textScale != _textScale || isInputDirty<input_S>(ctx)) {
            _x = x;
            _y = y;
            _textScale = textScale;
            text->setText(getValue<input_S>(ctx));
            text->setPosition(x, y);
            text->setTextScale(textScale);
            emitValue<output_GFXU0027>(ctx, text);
        }

        if (isInputDirty<input_GFX>(ctx)) {
            emitValue<output_GFXU0027>(ctx, text);
        }
    }
}
