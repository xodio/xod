#pragma XOD error_catch enable

struct State {
    bool lastValue = false;
    bool hadError = false;
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    auto state = getState(ctx);
    state->lastValue = isInputDirty<input_VAL>(ctx);
    state->hadError = getError<input_VAL>(ctx);
    // This node should check dirtieness of input port on each transaction
    // so we set timeout 0 to mark this node as dirty on the next transaction
    setTimeout(ctx, 0);
}
