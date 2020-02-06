
// clang-format off
{{#global}}
#include <Text.h>
{{/global}}
// clang-format on

struct State {
    uint8_t mem[sizeof(Text)];
    Text* textColored;

    uint8_t textScale;
    int16_t x, y;
    XColor textColor;
};

// clang-format off
{{ GENERATED_CODE }}
// clang-format on

void evaluate(Context ctx) {

    auto state = getState(ctx);
    auto gfx = getValue<input_GFX>(ctx);

    state->textColor = getValue<input_C>(ctx);
    int16_t x = (int16_t)getValue<input_X>(ctx);
    int16_t y = (int16_t)getValue<input_Y>(ctx);
    uint8_t textScale = max(1, (int)getValue<input_SCL>(ctx));

    if (isSettingUp()) {
        state->textColored = new (state->mem) Text(gfx);
    }

    if (isSettingUp() || state->x != x || state->y != y || state->textScale != textScale || isInputDirty<input_S>(ctx) || isInputDirty<input_C>(ctx)) {
        state->x = x;
        state->y = y;
        state->textScale = textScale;
        state->textColored->setText(getValue<input_S>(ctx));
        state->textColored->setPosition(x, y);
        state->textColored->setTextScale(textScale);
        state->textColored->setTextColor(&state->textColor);
        emitValue<output_GFXU0027>(ctx, state->textColored);
    }

    if (isInputDirty<input_GFX>(ctx)) {
        emitValue<output_GFXU0027>(ctx, state->textColored);
    }
}
