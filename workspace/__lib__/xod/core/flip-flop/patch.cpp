struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    bool oldState = getValue<output_MEM>(ctx);
    bool newState = oldState;

    if (isInputDirty<input_RST>(ctx)) {
        newState = false;
    } else if (isInputDirty<input_SET>(ctx)) {
        newState = true;
    } else if (isInputDirty<input_TGL>(ctx)) {
        newState = !oldState;
    }

    if (newState == oldState)
        return;

    emitValue<output_MEM>(ctx, newState);
}
