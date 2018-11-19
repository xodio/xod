struct State {
    bool lastValue = false;
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    getState(ctx)->lastValue = isInputDirty<input_VAL>(ctx);
    // This node should check dirtieness of input port on each transaction
    // so we set timeout 0 to mark this node as dirty on the next transaction
    setTimeout(ctx, 0);
}
