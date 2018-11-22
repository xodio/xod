
#pragma XOD dirtieness disable output_OUT

struct State {
    Number refValue = 0;
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    auto state = getState(ctx);
    auto inValue = getValue<input_IN>(ctx);

    if (isInputDirty<input_RST>(ctx)) {
        state->refValue = 0;
        emitValue<output_OUT>(ctx, inValue);
        return;
    }

    if (isInputDirty<input_REF>(ctx)) {
        state->refValue = inValue;
    }

    auto outValue = inValue - state->refValue;
    emitValue<output_OUT>(ctx, outValue);
}
