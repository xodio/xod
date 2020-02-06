
// clang-format off
{{#global}}
#include <Text.h>
{{/global}}
// clang-format on

struct State {
    uint8_t mem[sizeof(Text)];
    Text* text;
    uint8_t textScale;
    int16_t x, y;
};

// clang-format off
{{ GENERATED_CODE }}
// clang-format on

void evaluate(Context ctx) {

    auto state = getState(ctx);
    auto gfx = getValue<input_GFX>(ctx);

    int16_t x = (int16_t)getValue<input_X>(ctx);
    int16_t y = (int16_t)getValue<input_Y>(ctx);
    uint8_t textScale = max(1, (int)getValue<input_SCL>(ctx));

    if (isSettingUp()) {
        state->text = new (state->mem) Text(gfx);
    }

    if (isSettingUp() || state->x != x || state->y != y || state->textScale != textScale || isInputDirty<input_S>(ctx)) {
        state->x = x;
        state->y = y;
        state->textScale = textScale;
        state->text->setText(getValue<input_S>(ctx));
        state->text->setPosition(x, y);
        state->text->setTextScale(textScale);
        emitValue<output_GFXU0027>(ctx, state->text);
    }

    if (isInputDirty<input_GFX>(ctx)) {
        emitValue<output_GFXU0027>(ctx, state->text);
    }
}
