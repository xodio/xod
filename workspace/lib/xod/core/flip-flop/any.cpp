struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    bool oldState = getValue<output_MEM>(ctx);
    bool newState = oldState;

    if (isInputDirty<input_TGL>(ctx)) {
        newState = !oldState;
    } else if (isInputDirty<input_SET>(ctx)) {
        newState = true;
    } else {
        newState = false;
    }

    if (newState == oldState)
        return;

    emitValue<output_MEM>(ctx, newState);
}
