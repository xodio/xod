
struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    auto mux = getValue<input_MUX>(ctx);

    if (isSettingUp()) {
        // Short-circuit RES and RES'
        emitValue<output_MUXU0027>(ctx, mux);
    }

    bool justEntered = false;
    auto nodeId = getNodeId(ctx);

    if (isInputDirty<input_ACQ>(ctx) && mux->lockFor(nodeId)) {
        justEntered = true;
    }

    if (isInputDirty<input_RLS>(ctx) && mux->unlock(nodeId)) {
        justEntered = false;
        emitValue<output_RLSd>(ctx, 1);
    }

    if (justEntered)
        emitValue<output_ACQd>(ctx, 1);

    if (isInputDirty<input_IN>(ctx) && mux->isLockedFor(nodeId))
        emitValue<output_OUT>(ctx, 1);
}
