
struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    auto mux = getValue<input_MUX>(ctx);

    if (isSettingUp()) {
        // Short-circuit RES and RES'
        emitValue<output_MUXU0027>(ctx, mux);
    }

    if (!isInputDirty<input_DO>(ctx))
        return;

    mux->forceUnlock();
    emitValue<output_DONE>(ctx, 1);
}
