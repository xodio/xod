
struct State {
    int pos = 0;
    int length;
};

{{ GENERATED_CODE }}

char charAt(XString str, int pos) {
    auto it = str.iterate();
    for (int i = 0; i < pos; i++) {
        ++it;
    }

    return *it;
}

void evaluate(Context ctx) {
    auto str = getValue<input_SEQ>(ctx);
    auto state = getState(ctx);

    if (isInputDirty<input_SEQ>(ctx)) {
        state->length = length(str);
        state->pos = 0;
    }

    if (!isInputDirty<input_IN2>(ctx))
        return;

    auto c = getValue<input_IN1>(ctx);
    if (c == charAt(str, state->pos)) {
        state->pos++;

        // it was the last char in a string
        if (state->pos == state->length) {
            emitValue<output_OUT>(ctx, 1);
            // we will start over on next pulse
            state->pos = 0;
        }
    } else {
        // we will start over on next pulse
        state->pos = 0;
    }
}
