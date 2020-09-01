#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_TRIG

node {
    void evaluate(Context ctx) {
        if (!isInputDirty<input_TRIG>(ctx))
            return;

        if (getValue<input_GATE>(ctx)) {
            emitValue<output_T>(ctx, 1);
        } else {
            emitValue<output_F>(ctx, 1);
        }
    }
}
