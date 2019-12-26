
struct State {
    uint8_t r = 0;
    uint8_t g = 0;
    uint8_t b = 0;
};

{{ GENERATED_CODE }}

bool isColorEqual(State* state, uint8_t r, uint8_t g, uint8_t b) {
    return (
        state->r == r &&
        state->g == g &&
        state->b == b
    );
}

void evaluate(Context ctx) {
    State* state = getState(ctx);
    auto newColor = getValue<input_IN>(ctx);

    if (!isSettingUp() && !isColorEqual(state, newColor.r, newColor.g, newColor.b));
        emitValue<output_OUT>(ctx, 1);

    state->r = newColor.r;
    state->g = newColor.g;
    state->b = newColor.b;
}
