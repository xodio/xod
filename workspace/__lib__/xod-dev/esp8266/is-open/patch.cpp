#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_CHK

node {
    void evaluate(Context ctx) {
        if (!isInputDirty<input_CHK>(ctx))
            return;

        auto inet = getValue<input_INET>(ctx);
        if (inet.wifi->isSocketOpen()) {
            emitValue<output_Y>(ctx, 1);
        } else {
            emitValue<output_N>(ctx, 1);
        }
    }
}
