#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_DO

node {
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
}
