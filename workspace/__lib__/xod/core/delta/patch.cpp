
#pragma XOD dirtieness disable output_OUT

struct State {
    Number prevValue = NAN;
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    auto state = getState(ctx);
    auto inValue = getValue<input_IN>(ctx);

    // Emit 0 in case of reset or the very first update
    auto outValue =
        (isInputDirty<input_RST>(ctx) || isnan(state->prevValue))
        ? 0
        : inValue - state->prevValue;

    emitValue<output_OUT>(ctx, outValue);
    state->prevValue = inValue;
}
