#include <Text.h>

node {
    uint8_t mem[sizeof(Text)];
    Text* textColored;

    uint8_t _textScale;
    int16_t _x, _y;
    XColor textColor;

    void evaluate(Context ctx) {
        auto gfx = getValue<input_GFX>(ctx);

        textColor = getValue<input_C>(ctx);
        int16_t x = (int16_t)getValue<input_X>(ctx);
        int16_t y = (int16_t)getValue<input_Y>(ctx);
        uint8_t textScale = max(1, (int)getValue<input_SCL>(ctx));

        if (isSettingUp()) {
            textColored = new (mem) Text(gfx);
        }

        if (isSettingUp() || _x != x || _y != y || _textScale != textScale || isInputDirty<input_S>(ctx) || isInputDirty<input_C>(ctx)) {
            _x = x;
            _y = y;
            _textScale = textScale;
            textColored->setText(getValue<input_S>(ctx));
            textColored->setPosition(x, y);
            textColored->setTextScale(textScale);
            textColored->setTextColor(&textColor);
            emitValue<output_GFXU0027>(ctx, textColored);
        }

        if (isInputDirty<input_GFX>(ctx)) {
            emitValue<output_GFXU0027>(ctx, textColored);
        }
    }
}
