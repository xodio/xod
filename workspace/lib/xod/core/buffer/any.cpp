struct State {
    Number value;
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    if (!isInputDirty<input_UPD>(ctx))
        return;

    State* state = getState(ctx);
    auto newValue = getValue<input_NEW>(ctx);
    if (newValue == state->value)
        return;

    state->value = newValue;
    emitValue<output_MEM>(ctx, newValue);
}
