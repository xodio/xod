#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_UPD

node {
    void evaluate(Context ctx) {
        if (!isInputDirty<input_UPD>(ctx))
            return;

        auto uart = getValue<input_UART>(ctx);
        bool available = uart->available();
        if (available) {
            emitValue<output_Y>(ctx, 1);
        } else {
            emitValue<output_N>(ctx, 1);
        }
    }
}
